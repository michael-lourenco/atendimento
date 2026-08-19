import { ScheduledMessage } from '../entities/ScheduledMessage';
import { dueScheduledMessages } from '../entities/dueScheduledMessages';
import { IScheduledMessageRepository } from '../repositories/IScheduledMessageRepository';
import { SendWhatsAppMessageInput } from './SendWhatsAppMessageUseCase';

type Sender = {
  execute: (input: SendWhatsAppMessageInput) => Promise<unknown>;
};

type Pause = {
  execute: (contactId: string) => Promise<void>;
};

export class DispatchDueScheduledMessagesUseCase {
  constructor(
    private schedules: IScheduledMessageRepository,
    private send: Sender,
    private pause: Pause
  ) {}

  async execute(now = new Date()): Promise<{ sent: string[]; failed: string[] }> {
    const due = dueScheduledMessages(await this.schedules.getAll(), now);
    const sent: string[] = [];
    const failed: string[] = [];

    for (const item of due) {
      if (!item.contact.trim() || !item.message.trim()) {
        await this.mark(item, 'failed');
        failed.push(item.id);
        continue;
      }
      try {
        await this.send.execute({ to: item.contact, message: item.message });
        try {
          await this.pause.execute(item.contact);
        } catch {
          // o WhatsApp já saiu
        }
        await this.mark(item, 'sent');
        sent.push(item.id);
      } catch {
        await this.mark(item, 'failed');
        failed.push(item.id);
      }
    }

    return { sent, failed };
  }

  private mark(item: ScheduledMessage, status: 'sent' | 'failed'): Promise<void> {
    return this.schedules.save({ ...item, status });
  }
}
