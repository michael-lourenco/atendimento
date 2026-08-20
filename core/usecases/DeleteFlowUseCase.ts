import { IFlowRepository } from '../repositories/IFlowRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';

export class DeleteFlowUseCase {
  constructor(
    private flows: IFlowRepository,
    private sessions: IFlowSessionRepository,
    private chatbots: IChatbotRepository,
    private numbers: IWhatsAppNumberRepository | null = null
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
    if (this.numbers) {
      const lines = await this.numbers.getAll();
      for (const line of lines) {
        if (line.flowId === id) {
          await this.numbers.save({ ...line, flowId: undefined });
        }
      }
    }
    await this.flows.delete(id);
  }
}
