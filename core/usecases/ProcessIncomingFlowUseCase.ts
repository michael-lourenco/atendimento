import { Message } from '../entities/Message';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { planFlowTurn } from '../engine/planFlowTurn';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { loadFlowStepMedia } from './loadFlowStepMedia';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { contactPhoneFromMessage } from './UpsertConversationFromMessageUseCase';
import { conversationThreadId, messagesOnWhatsAppLine } from '../entities/conversationThread';
import { matchWhatsAppNumber } from '../entities/whatsappNumberLine';
import { activeBusinessHours, isWithinBusinessHours } from '../entities/businessHours';
import { queuePlace, queuePlaceLine } from '../entities/queuePlace';
import { FlowSession } from '../entities/FlowSession';
import { FlowAudience, IncomingFlowHint } from '../entities/flowAudience';
import { planSessionForTurn } from '../entities/flowAudienceSession';
import { latestIncomingText } from '../entities/botIdle';
import { BotBehavior, resolveBotBehavior } from '../entities/botBehavior';
import { SendWhatsAppPresenceUseCase } from './SendWhatsAppPresenceUseCase';
import { waitBotRhythm } from './waitBotRhythm';

export interface ProcessIncomingFlowInput {
  contactId: string;
  text: string;
  instanceName?: string;
  sessionKey?: string;
  audience?: FlowAudience;
  reopened?: boolean;
}

export type ProcessIncomingFlowOptions = {
  messages?: IMessageRepository | null;
  presence?: SendWhatsAppPresenceUseCase | null;
  sleep?: (ms: number) => Promise<void>;
};

export class ProcessIncomingFlowUseCase {
  private sleep: (ms: number) => Promise<void>;

  constructor(
    private flowRepository: IFlowRepository,
    private sessionRepository: IFlowSessionRepository,
    private sendMessage: SendWhatsAppMessageUseCase,
    private setDepartment: SetConversationDepartmentUseCase | null = null,
    private departments: IDepartmentRepository | null = null,
    private numbers: IWhatsAppNumberRepository | null = null,
    private chatbots: IChatbotRepository | null = null,
    private conversations: IConversationRepository | null = null,
    private options: ProcessIncomingFlowOptions = {}
  ) {
    this.sleep = options.sleep ?? defaultSleep;
  }

  async executeForMessages(messages: Message[], hints: IncomingFlowHint[] = []): Promise<void> {
    const catalog = this.numbers ? await this.numbers.getAll() : [];
    const hintByKey = new Map<string, IncomingFlowHint>();
    for (const hint of hints) {
      if (!hintByKey.has(hint.sessionKey)) {
        hintByKey.set(hint.sessionKey, hint);
      }
    }
    const groups = new Map<
      string,
      {
        phone: string;
        text: string;
        instanceName?: string;
        audience: FlowAudience;
        reopened: boolean;
      }
    >();
    for (const message of messages) {
      if (message.direction !== 'incoming' || message.type !== 'text') {
        continue;
      }
      const text = message.content.trim();
      if (!text) {
        continue;
      }
      const phone = contactPhoneFromMessage(message);
      const line = matchWhatsAppNumber(catalog, message.to);
      const sessionKey = conversationThreadId(phone, line?.id);
      const hint = hintByKey.get(sessionKey);
      groups.set(sessionKey, {
        phone,
        text,
        instanceName: message.to,
        audience: hint?.audience ?? 'new',
        reopened: hint?.reopened ?? false,
      });
    }
    for (const [sessionKey, group] of groups) {
      await this.execute({
        contactId: group.phone,
        text: group.text,
        instanceName: group.instanceName,
        sessionKey,
        audience: group.audience,
        reopened: group.reopened,
      });
    }
  }

  async execute(input: ProcessIncomingFlowInput): Promise<void> {
    const sessionKey = input.sessionKey ?? input.contactId;
    const audience = input.audience ?? 'new';
    const reopened = Boolean(input.reopened);
    const now = new Date();
    const flows = await this.flowRepository.getAll();
    let session = await this.sessionRepository.getByContactId(sessionKey);
    if (session?.paused && !reopened) {
      return;
    }
    let turnAudience = audience;
    if (session?.outsideHoursNotified && !session.currentStepId) {
      session = null;
      turnAudience = 'new';
    }
    const planned = planSessionForTurn({
      session,
      audience: turnAudience,
      reopened,
      contactId: sessionKey,
      now,
    });
    if (planned.skip) {
      return;
    }
    session = planned.session;

    const bots = this.chatbots ? await this.chatbots.getAll() : null;
    const behavior = resolveBotBehavior(bots);
    const text = await this.textAfterDebounce(input, behavior);

    const hours = activeBusinessHours(bots ?? []);
    if (!isWithinBusinessHours(hours, now)) {
      await this.notifyClosed(input.contactId, sessionKey, session, hours?.closedMessage ?? '', now);
      return;
    }

    const flow = resolveActiveFlow(flows, session?.flowId);
    if (!flow) {
      console.warn('[ProcessIncomingFlow] Nenhum fluxo ativo; sem resposta automática.');
      return;
    }

    const plan = planFlowTurn({
      flow,
      flows,
      session,
      contactId: sessionKey,
      incomingText: text,
      now,
    });

    for (const effect of plan.effects) {
      await this.applySetDepartment(sessionKey, effect.departmentId);
    }

    if (plan.nextSession.paused) {
      await this.appendQueuePlace(plan.replies, sessionKey);
    }

    for (let index = 0; index < plan.replies.length; index += 1) {
      const reply = plan.replies[index];
      const waitMs =
        index === 0
          ? behavior.replyDelayMs + (reply.delayMs ?? 0)
          : reply.delayMs || behavior.bubbleDelayMs;
      await waitBotRhythm({
        waitMs,
        behavior,
        loadConversation: this.conversations
          ? () => this.conversations!.getById(sessionKey)
          : undefined,
        presence: this.options.presence,
        to: input.contactId,
        instanceName: input.instanceName,
        sleep: this.sleep,
      });
      const media = reply.mediaUrl
        ? await loadFlowStepMedia(reply.mediaUrl, reply.mediaKind ?? 'image')
        : null;
      await this.sendMessage.execute({
        to: input.contactId,
        message: reply.content,
        flowId: reply.flowId,
        stepId: reply.stepId,
        instanceName: input.instanceName,
        conversationId: sessionKey,
        ...(media ? { media } : {}),
      });
    }

    await this.sessionRepository.save({
      ...plan.nextSession,
      outsideHoursNotified: false,
    });
  }

  private async textAfterDebounce(
    input: ProcessIncomingFlowInput,
    behavior: BotBehavior
  ): Promise<string> {
    if (behavior.inboundDebounceMs <= 0 || !this.options.messages) {
      return input.text;
    }
    await this.sleep(behavior.inboundDebounceMs);
    const catalog = this.numbers ? await this.numbers.getAll() : [];
    const line = matchWhatsAppNumber(catalog, input.instanceName);
    const list = await this.options.messages.getByContact(input.contactId);
    return latestIncomingText(messagesOnWhatsAppLine(list, line), input.text);
  }

  private async notifyClosed(
    phone: string,
    sessionKey: string,
    session: FlowSession | null,
    closedMessage: string,
    now: Date
  ): Promise<void> {
    if (session?.outsideHoursNotified) {
      return;
    }
    const text = closedMessage.trim();
    if (text) {
      await this.sendMessage.execute({
        to: phone,
        message: text,
        conversationId: sessionKey,
      });
    }
    await this.sessionRepository.save({
      contactId: sessionKey,
      flowId: session?.flowId ?? 'inicio',
      currentStepId: null,
      paused: false,
      outsideHoursNotified: true,
      updatedAt: now,
    });
  }

  private async appendQueuePlace(
    replies: { content: string }[],
    sessionKey: string
  ): Promise<void> {
    if (!this.conversations || replies.length === 0) {
      return;
    }
    const [all, current] = await Promise.all([
      this.conversations.getAll(),
      this.conversations.getById(sessionKey),
    ]);
    if (!current) {
      return;
    }
    const last = replies[replies.length - 1];
    last.content = `${last.content} ${queuePlaceLine(queuePlace(all, current))}`.trim();
  }

  private async applySetDepartment(contactId: string, departmentId: string): Promise<void> {
    if (!this.setDepartment || !this.departments) {
      return;
    }
    const department = await this.departments.getById(departmentId);
    if (!department?.isActive) {
      console.warn('[ProcessIncomingFlow] Setor do fluxo não encontrado ou inativo:', departmentId);
      return;
    }
    await this.setDepartment.execute({
      conversationId: contactId,
      departmentId: department.id,
      departmentName: department.name,
    });
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
