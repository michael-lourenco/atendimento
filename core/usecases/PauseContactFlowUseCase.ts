import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { resolveActiveFlow } from '../engine/resolveActiveFlow';
import { resolveEntryFlowId } from '../entities/chatbotActive';

export class PauseContactFlowUseCase {
  constructor(
    private sessions: IFlowSessionRepository,
    private flows: IFlowRepository,
    private chatbots: IChatbotRepository | null = null,
    private numbers: IWhatsAppNumberRepository | null = null,
    private conversations: IConversationRepository | null = null
  ) {}

  async execute(contactId: string): Promise<void> {
    const phone = contactId.trim();
    if (!phone) {
      return;
    }

    const existing = await this.sessions.getByContactId(phone);
    if (existing) {
      await this.sessions.save({
        ...existing,
        paused: true,
        updatedAt: new Date(),
      });
      return;
    }

    const bots = this.chatbots ? await this.chatbots.getAll() : [];
    const conversation = this.conversations ? await this.conversations.getById(phone) : null;
    const line =
      conversation?.whatsappNumberId && this.numbers
        ? await this.numbers.getById(conversation.whatsappNumberId)
        : null;
    const flow = resolveActiveFlow(await this.flows.getAll(), {
      entryFlowId: resolveEntryFlowId({ bots, lineFlowId: line?.flowId }),
    });
    if (!flow) {
      return;
    }

    await this.sessions.save({
      contactId: phone,
      flowId: flow.id,
      currentStepId: null,
      paused: true,
      updatedAt: new Date(),
    });
  }
}
