import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';

export class DeleteFlowUseCase {
  constructor(
    private flows: IFlowRepository,
    private sessions: IFlowSessionRepository,
    private chatbots: IChatbotRepository
  ) {}

  async execute(id: string): Promise<void> {
    await this.sessions.deleteByFlowId(id);
    const now = new Date();
    const bots = await this.chatbots.getAll();
    for (const bot of bots) {
      if (bot.flowId === id) {
        await this.chatbots.save({ ...bot, flowId: undefined, updatedAt: now });
      }
    }
    await this.flows.delete(id);
  }
}
