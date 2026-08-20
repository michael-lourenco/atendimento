import { Message } from '../entities/Message';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { planFlowTurn } from '../engine/planFlowTurn';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { loadFlowStepMedia } from './loadFlowStepMedia';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { contactPhoneFromMessage } from './UpsertConversationFromMessageUseCase';
import { conversationThreadId } from '../entities/conversationThread';
import { matchWhatsAppNumber } from '../entities/whatsappNumberLine';
import { activeBusinessHours, isWithinBusinessHours } from '../entities/businessHours';
import { queuePlace, queuePlaceLine } from '../entities/queuePlace';
import { FlowSession } from '../entities/FlowSession';

export interface ProcessIncomingFlowInput {
  contactId: string;
  text: string;
  instanceName?: string;
  sessionKey?: string;
}

export class ProcessIncomingFlowUseCase {
  constructor(
    private flowRepository: IFlowRepository,
    private sessionRepository: IFlowSessionRepository,
    private sendMessage: SendWhatsAppMessageUseCase,
    private setDepartment: SetConversationDepartmentUseCase | null = null,
    private departments: IDepartmentRepository | null = null,
    private numbers: IWhatsAppNumberRepository | null = null,
    private chatbots: IChatbotRepository | null = null,
    private conversations: IConversationRepository | null = null
  ) {}

  async executeForMessages(messages: Message[]): Promise<void> {
    for (const message of messages) {
      if (message.direction !== 'incoming' || message.type !== 'text') {
        continue;
      }
      const text = message.content.trim();
      if (!text) {
        continue;
      }
      const phone = contactPhoneFromMessage(message);
      const catalog = this.numbers ? await this.numbers.getAll() : [];
      const line = matchWhatsAppNumber(catalog, message.to);
      await this.execute({
        contactId: phone,
        text,
        instanceName: message.to,
        sessionKey: conversationThreadId(phone, line?.id),
      });
    }
  }

  async execute(input: ProcessIncomingFlowInput): Promise<void> {
    const sessionKey = input.sessionKey ?? input.contactId;
    const now = new Date();
    const flows = await this.flowRepository.getAll();
    let session = await this.sessionRepository.getByContactId(sessionKey);
    if (session?.paused) {
      return;
    }

    const bots = this.chatbots ? await this.chatbots.getAll() : [];
    const hours = activeBusinessHours(bots);
    if (!isWithinBusinessHours(hours, now)) {
      await this.notifyClosed(input.contactId, sessionKey, session, hours?.closedMessage ?? '', now);
      return;
    }
    if (session?.outsideHoursNotified && !session.currentStepId) {
      session = null;
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
      incomingText: input.text,
      now,
    });

    for (const effect of plan.effects) {
      await this.applySetDepartment(sessionKey, effect.departmentId);
    }

    if (plan.nextSession.paused) {
      await this.appendQueuePlace(plan.replies, sessionKey);
    }

    for (const reply of plan.replies) {
      if (reply.delayMs) {
        await sleep(reply.delayMs);
      }
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
