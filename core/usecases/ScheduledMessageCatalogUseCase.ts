import { ScheduledMessage } from '../entities/ScheduledMessage';
import { IScheduledMessageRepository } from '../repositories/IScheduledMessageRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class ScheduledMessageCatalogUseCase extends CatalogUseCase<ScheduledMessage> {
  constructor(repo: IScheduledMessageRepository) {
    super(repo);
  }
}
