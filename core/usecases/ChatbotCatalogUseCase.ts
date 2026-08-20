import { Chatbot } from '../entities/Chatbot';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class ChatbotCatalogUseCase extends CatalogUseCase<Chatbot> {
  constructor(repo: IChatbotRepository) {
    super(repo);
  }
}
