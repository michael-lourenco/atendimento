import { Message } from '../entities/Message';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { planFlowTurn } from '../engine/planFlowTurn';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';

export interface ProcessIncomingFlowInput {
  contactId: string;
  text: string;
}

export class ProcessIncomingFlowUseCase {
  constructor(
    private flowRepository: IFlowRepository,
    private sessionRepository: IFlowSessionRepository,
    private sendMessage: SendWhatsAppMessageUseCase
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
}
