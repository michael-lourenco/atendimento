import { Message } from '../entities/Message';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { messagesOnWhatsAppLine } from '../entities/conversationThread';
import { IMessageRepository } from '../repositories/IMessageRepository';

export class GetMessagesByContactUseCase {
  constructor(private repository: IMessageRepository) {}

  async execute(contactId: string, line?: WhatsAppNumber | null): Promise<Message[]> {
    const list = await this.repository.getByContact(contactId);
    return messagesOnWhatsAppLine(list, line);
  }
}
