import { Message } from '../entities/Message';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IMediaStorage } from '../services/IMediaStorage';
import { planFlowTurn } from '../engine/planFlowTurn';
import { decorateFlowTurn } from '../engine/decorateFlowTurn';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { loadFlowStepMedia } from './loadFlowStepMedia';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { contactPhoneFromMessage } from './UpsertConversationFromMessageUseCase';
import { conversationThreadId, messagesOnWhatsAppLine } from '../entities/conversationThread';
import { matchWhatsAppNumber } from '../entities/whatsappNumberLine';
import { isWithinBusinessHours, resolveBusinessHours } from '../entities/businessHours';
import { resolveEntryFlowId } from '../entities/chatbotActive';
import { FlowAudience, IncomingFlowHint } from '../entities/flowAudience';
import { planSessionForTurn } from '../entities/flowAudienceSession';
import { latestIncomingAt, latestIncomingText } from '../entities/botIdle';
import { BotBehavior, resolveBotBehavior } from '../entities/botBehavior';
import { flowsForEngine } from '../entities/flowPublish';
import { shouldSkipConsumedIncoming } from '../entities/flowSessionTurn';
import { SendWhatsAppPresenceUseCase } from './SendWhatsAppPresenceUseCase';
import { waitBotRhythm } from './waitBotRhythm';
import { runExclusive } from '../engine/runExclusive';
import {
  appendQueuePlace,
  applyFlowDepartment,
  hintIncomingMedia,
  notifyClosedHours,
} from './processIncomingFlowSupport';

export interface ProcessIncomingFlowInput {
  contactId: string;
  text: string;
  instanceName?: string;
  sessionKey?: string;
  audience?: FlowAudience;
  reopened?: boolean;
  incomingAt?: Date;
}

export type ProcessIncomingFlowOptions = {
  messages?: IMessageRepository | null;
  presence?: SendWhatsAppPresenceUseCase | null;
  sleep?: (ms: number) => Promise<void>;
  mediaStorage?: IMediaStorage | null;
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
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async executeForMessages(messages: Message[], hints: IncomingFlowHint[] = []): Promise<void> {
    const catalog = this.numbers ? await this.numbers.getAll() : [];
    const hintByKey = new Map<string, IncomingFlowHint>();
    for (const hint of hints) {
      if (!hintByKey.has(hint.sessionKey)) {
        hintByKey.set(hint.sessionKey, hint);
      }
    }
    const byThread = new Map<string, ProcessIncomingFlowInput[]>();
    const mediaOnly = new Map<string, { phone: string; instanceName?: string }>();
    for (const message of messages) {
      if (message.direction !== 'incoming') {
        continue;
      }
      const phone = contactPhoneFromMessage(message);
      const line = matchWhatsAppNumber(catalog, message.to);
      const sessionKey = conversationThreadId(phone, line?.id);
      if (message.type !== 'text' && !message.content.trim()) {
        mediaOnly.set(sessionKey, { phone, instanceName: message.to });
        continue;
      }
      const text = message.content.trim();
      if (!text) {
        continue;
      }
      const hint = hintByKey.get(sessionKey);
      const turns = byThread.get(sessionKey) ?? [];
      turns.push({
        contactId: phone,
        text,
        instanceName: message.to,
        sessionKey,
        audience: hint?.audience ?? 'new',
        reopened: hint?.reopened ?? false,
        incomingAt: message.timestamp,
      });
      byThread.set(sessionKey, turns);
    }
    await Promise.all(
      [...byThread.entries()].map(async ([sessionKey, turns]) => {
        mediaOnly.delete(sessionKey);
        for (const turn of turns) {
          await this.execute(turn);
        }
      })
    );
    await Promise.all(
      [...mediaOnly.entries()].map(([sessionKey, item]) =>
        hintIncomingMedia({
          sessionKey,
          phone: item.phone,
          instanceName: item.instanceName,
          sessions: this.sessionRepository,
          chatbots: this.chatbots,
          numbers: this.numbers,
          sendMessage: this.sendMessage,
        })
      )
    );
  }

  async execute(input: ProcessIncomingFlowInput): Promise<void> {
    const sessionKey = input.sessionKey ?? input.contactId;
    await runExclusive(sessionKey, () => this.executeTurn(input, sessionKey));
  }

  private async executeTurn(
    input: ProcessIncomingFlowInput,
    sessionKey: string
  ): Promise<void> {
    const audience = input.audience ?? 'new';
    const reopened = Boolean(input.reopened);
    const now = new Date();
    const rawFlows = await this.flowRepository.getAll();
    const flows = flowsForEngine(rawFlows);
    let session = await this.sessionRepository.getByContactId(sessionKey);
    if (shouldSkipConsumedIncoming(session, input.incomingAt)) {
      return;
    }
    if (session?.paused && !reopened) {
      return;
    }
    let turnAudience = audience;
    if (session?.outsideHoursNotified && !session.currentStepId) {
      session = null;
      turnAudience = 'new';
    }

    const bots = this.chatbots ? await this.chatbots.getAll() : null;
    const lineCatalog = this.numbers ? await this.numbers.getAll() : [];
    const line = matchWhatsAppNumber(lineCatalog, input.instanceName);
    const behavior = resolveBotBehavior(bots, line?.behavior);
    const afterDebounce = await this.textAfterDebounce(input, behavior, now);

    const hours = resolveBusinessHours(bots, line?.businessHours);
    const flow = resolveActiveFlow(flows, {
      sessionFlowId: session?.flowId,
      entryFlowId: resolveEntryFlowId({ bots, lineFlowId: line?.flowId }),
    });
    if (!isWithinBusinessHours(hours, now)) {
      await notifyClosedHours({
        phone: input.contactId,
        sessionKey,
        session,
        closedMessage: hours?.closedMessage ?? '',
        now,
        entryFlowId: flow?.id,
        sendMessage: this.sendMessage,
        saveSession: (next) => this.sessionRepository.save(next),
      });
      return;
    }

    const planned = planSessionForTurn({
      session,
      audience: turnAudience,
      reopened,
      contactId: sessionKey,
      now,
      entryFlowId: flow?.id,
    });
    if (planned.skip) {
      return;
    }
    session = planned.session;

    if (!flow) {
      return;
    }

    const plan = decorateFlowTurn({
      plan: planFlowTurn({
        flow,
        flows,
        session,
        contactId: sessionKey,
        incomingText: afterDebounce.text,
        now,
      }),
      session,
      consumedAt: afterDebounce.consumedAt,
      missAfter: behavior.missHandoffAfter,
      departmentId: (await this.conversations?.getById(sessionKey))?.departmentId,
      now,
    });

    for (const effect of plan.effects) {
      await applyFlowDepartment({
        contactId: sessionKey,
        departmentId: effect.departmentId,
        setDepartment: this.setDepartment,
        departments: this.departments,
      });
    }

    if (plan.nextSession.paused) {
      await appendQueuePlace(plan.replies, sessionKey, this.conversations);
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
        ? await loadFlowStepMedia(reply.mediaUrl, reply.mediaKind ?? 'image', this.options.mediaStorage)
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

    await this.sessionRepository.save(plan.nextSession);
  }

  private async textAfterDebounce(
    input: ProcessIncomingFlowInput,
    behavior: BotBehavior,
    now: Date
  ): Promise<{ text: string; consumedAt: Date }> {
    const fallbackAt = input.incomingAt ?? now;
    if (behavior.inboundDebounceMs <= 0 || !this.options.messages) {
      return { text: input.text, consumedAt: fallbackAt };
    }
    await this.sleep(behavior.inboundDebounceMs);
    const catalog = this.numbers ? await this.numbers.getAll() : [];
    const line = matchWhatsAppNumber(catalog, input.instanceName);
    const list = await this.options.messages.getByContact(input.contactId);
    const onLine = messagesOnWhatsAppLine(list, line);
    return {
      text: latestIncomingText(onLine, input.text),
      consumedAt: latestIncomingAt(onLine, fallbackAt),
    };
  }
}
