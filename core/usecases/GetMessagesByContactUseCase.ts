import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { messagesOnWhatsAppLine } from '../entities/conversationThread';

export class GetMessagesByContactUseCase {
  async execute(contactId: string, line?: WhatsAppNumber | null): Promise<Message[]> {
    const repository = serviceLocator.getMessageRepository();
    const list = await repository.getByContact(contactId);
    return messagesOnWhatsAppLine(list, line);
  }
}
