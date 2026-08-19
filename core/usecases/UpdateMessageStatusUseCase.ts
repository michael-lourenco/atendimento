import { Message, MessageStatus } from '../entities/Message';
import { mergeMessageStatus } from '../entities/messageStatus';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class UpdateMessageStatusUseCase {
  constructor(private messages: IMessageRepository = serviceLocator.getMessageRepository()) {}

  async execute(id: string, next: MessageStatus): Promise<Message | null> {
    const existing = await this.messages.getById(id);
    if (!existing) return null;
    const status = mergeMessageStatus(existing.status, next);
    if (status === existing.status) return existing;
    const updated = { ...existing, status };
    await this.messages.save(updated);
    return updated;
  }
}
