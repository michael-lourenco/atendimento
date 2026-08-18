import { InternalMessage } from '../entities/InternalMessage';
import { IInternalMessageRepository } from '../repositories/IInternalMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class SaveInternalMessageUseCase {
  constructor(
    private messages: IInternalMessageRepository = serviceLocator.getInternalMessageRepository()
  ) {}

  execute(message: InternalMessage): Promise<void> {
    return this.messages.save(message);
  }
}
