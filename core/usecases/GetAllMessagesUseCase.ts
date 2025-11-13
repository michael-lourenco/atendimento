import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';

export class GetAllMessagesUseCase {
  async execute(): Promise<Message[]> {
    const repository = serviceLocator.getMessageRepository();
    return repository.getAll();
  }
}

