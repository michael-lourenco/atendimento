import { Chatbot } from '../entities/Chatbot';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class ChatbotCatalogUseCase extends CatalogUseCase<Chatbot> {
  constructor(repo: IChatbotRepository = serviceLocator.getChatbotRepository()) {
    super(repo);
  }
}
