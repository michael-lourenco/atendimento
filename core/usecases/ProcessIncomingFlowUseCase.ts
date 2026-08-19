import { Message } from '../entities/Message';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { planFlowTurn } from '../engine/planFlowTurn';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { contactPhoneFromMessage } from './UpsertConversationFromMessageUseCase';
import { conversationThreadId } from '../entities/conversationThread';
import { matchWhatsAppNumber } from '../entities/whatsappNumberLine';

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
    private numbers: IWhatsAppNumberRepository | null = null
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
    const flows = await this.flowRepository.getAll();
    const session = await this.sessionRepository.getByContactId(sessionKey);
    if (session?.paused) {
      return;
    }
    const flow = resolveActiveFlow(flows, session?.flowId);

    if (!flow) {
      console.warn('[ProcessIncomingFlow] Nenhum fluxo ativo; sem resposta automática.');
      return;
    }

    const plan = planFlowTurn({
      flow,
      session,
      contactId: sessionKey,
      incomingText: input.text,
      now: new Date(),
    });

    for (const effect of plan.effects) {
      await this.applySetDepartment(sessionKey, effect.departmentId);
    }

    for (const reply of plan.replies) {
      await this.sendMessage.execute({
        to: input.contactId,
        message: reply.content,
        flowId: flow.id,
        stepId: reply.stepId,
        instanceName: input.instanceName,
        conversationId: sessionKey,
      });
    }

    await this.sessionRepository.save(plan.nextSession);
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
