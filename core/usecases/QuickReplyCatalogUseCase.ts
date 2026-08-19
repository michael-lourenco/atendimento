import { QuickReply } from '../entities/QuickReply';
import { IQuickReplyRepository } from '../repositories/IQuickReplyRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class QuickReplyCatalogUseCase extends CatalogUseCase<QuickReply> {
  constructor(repo: IQuickReplyRepository = serviceLocator.getQuickReplyRepository()) {
    super(repo);
  }
}
