import { InternalMessage } from '../entities/InternalMessage';
import { IInternalMessageRepository } from '../repositories/IInternalMessageRepository';

export class SaveInternalMessageUseCase {
  constructor(
    private messages: IInternalMessageRepository
  ) {}

  execute(message: InternalMessage): Promise<void> {
    return this.messages.save(message);
  }
}
