import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';

export class GetMessagesByContactUseCase {
  async execute(contactId: string): Promise<Message[]> {
    const repository = serviceLocator.getMessageRepository();
    return repository.getByContact(contactId);
  }
}

