import { ScheduledMessage } from '../entities/ScheduledMessage';
import { IScheduledMessageRepository } from '../repositories/IScheduledMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class ScheduledMessageCatalogUseCase extends CatalogUseCase<ScheduledMessage> {
  constructor(repo: IScheduledMessageRepository = serviceLocator.getScheduledMessageRepository()) {
    super(repo);
  }
}
