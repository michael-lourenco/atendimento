import { Message } from '../entities/Message';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { planFlowTurn } from '../engine/planFlowTurn';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';
import { SetConversationDepartmentUseCase } from './SetConversationDepartmentUseCase';

export interface ProcessIncomingFlowInput {
  contactId: string;
  text: string;
}

export class ProcessIncomingFlowUseCase {
  constructor(
    private flowRepository: IFlowRepository,
    private sessionRepository: IFlowSessionRepository,
    private sendMessage: SendWhatsAppMessageUseCase,
    private setDepartment: SetConversationDepartmentUseCase | null = null,
    private departments: IDepartmentRepository | null = null
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
      await this.execute({ contactId: message.from, text });
    }
  }

  async execute(input: ProcessIncomingFlowInput): Promise<void> {
    const flows = await this.flowRepository.getAll();
    const session = await this.sessionRepository.getByContactId(input.contactId);
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
      contactId: input.contactId,
      incomingText: input.text,
      now: new Date(),
    });

    for (const effect of plan.effects) {
      await this.applySetDepartment(input.contactId, effect.departmentId);
    }

    for (const reply of plan.replies) {
      await this.sendMessage.execute({
        to: input.contactId,
        message: reply.content,
        flowId: flow.id,
        stepId: reply.stepId,
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
