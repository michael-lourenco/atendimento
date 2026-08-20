import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';

export class GetAllMessagesUseCase {
  constructor(private repository: IMessageRepository) {}

  execute(): Promise<Message[]> {
    return this.repository.getAll();
  }
}
