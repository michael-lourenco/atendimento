import { Chatbot } from '../entities/Chatbot';
import { othersToDeactivate } from '../entities/chatbotActive';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { CatalogUseCase } from './CatalogUseCase';
import { assertHealthyEntryFlow } from './PublishFlowUseCase';

export class ChatbotCatalogUseCase extends CatalogUseCase<Chatbot> {
  constructor(
    repo: IChatbotRepository,
    private flows: IFlowRepository | null = null
  ) {
    super(repo);
  }

  async save(entity: Chatbot): Promise<void> {
    if (this.flows) {
      assertHealthyEntryFlow(entity.flowId, await this.flows.getAll());
    }
    const others = othersToDeactivate(await this.list(), entity);
    for (const other of others) {
      await super.save({ ...other, isActive: false, updatedAt: entity.updatedAt });
    }
    await super.save(entity);
  }
}
