import { Chatbot } from '../entities/Chatbot';
import { othersToDeactivate } from '../entities/chatbotActive';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class ChatbotCatalogUseCase extends CatalogUseCase<Chatbot> {
  constructor(repo: IChatbotRepository) {
    super(repo);
  }

  async save(entity: Chatbot): Promise<void> {
    const others = othersToDeactivate(await this.list(), entity);
    for (const other of others) {
      await super.save({ ...other, isActive: false, updatedAt: entity.updatedAt });
    }
    await super.save(entity);
  }
}
