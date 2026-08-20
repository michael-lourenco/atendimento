import { QuickReply } from '../entities/QuickReply';
import { IQuickReplyRepository } from '../repositories/IQuickReplyRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class QuickReplyCatalogUseCase extends CatalogUseCase<QuickReply> {
  constructor(repo: IQuickReplyRepository) {
    super(repo);
  }
}
