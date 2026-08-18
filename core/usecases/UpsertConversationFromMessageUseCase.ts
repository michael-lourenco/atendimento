import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { pickWhatsAppDisplayName } from '../entities/pickWhatsAppDisplayName';

export function contactPhoneFromMessage(message: Message): string {
  const phone = message.direction === 'incoming' ? message.from : message.to;
  return phone.replace(/\D/g, '') || phone;
}

function asDate(value: Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export class UpsertConversationFromMessageUseCase {
  constructor(
    private conversations: IConversationRepository = serviceLocator.getConversationRepository(),
    private contacts: IContactRepository = serviceLocator.getContactRepository()
  ) {}

  private async resolveName(phone: string, messageName?: string): Promise<string> {
    const contact = await this.contacts.getById(phone);
    return pickWhatsAppDisplayName(phone, messageName, contact?.name);
  }

  async execute(message: Message): Promise<Conversation | null> {
    const contactPhone = contactPhoneFromMessage(message);
    if (!contactPhone) {
      return null;
    }

    const existing = await this.conversations.getById(contactPhone);
    const now = asDate(message.timestamp);
    const incoming = message.direction === 'incoming';
    const contactName = await this.resolveName(contactPhone, message.contactName);

    if (!existing) {
      const created: Conversation = {
        id: contactPhone,
        contactId: contactPhone,
        contactName,
        contactPhone,
        status: 'open',
        unreadCount: incoming ? 1 : 0,
        lastMessage: message,
        lastActivity: now,
        createdAt: now,
        tags: [],
      };
      await this.conversations.save(created);
      return created;
    }

    const updated: Conversation = {
      ...existing,
      contactName,
      lastMessage: message,
      lastActivity: now,
      unreadCount: incoming ? existing.unreadCount + 1 : existing.unreadCount,
      status: existing.status === 'closed' ? 'open' : existing.status,
    };
    await this.conversations.save(updated);
    return updated;
  }

  async ensureFromMessages(messages: Message[]): Promise<void> {
    const existing = await this.conversations.getAll();
    const have = new Map(existing.map((item) => [item.id, item]));
    const grouped = new Map<string, Message[]>();

    for (const message of messages) {
      const phone = contactPhoneFromMessage(message);
      if (!phone) {
        continue;
      }
      const list = grouped.get(phone) ?? [];
      list.push(message);
      grouped.set(phone, list);
    }

    for (const [phone, list] of grouped) {
      const current = have.get(phone);
      const last = [...list].sort(
        (a, b) => asDate(a.timestamp).getTime() - asDate(b.timestamp).getTime()
      )[list.length - 1];
      const contactName = await this.resolveName(phone, last.contactName);

      if (!current) {
        const ordered = [...list].sort(
          (a, b) => asDate(a.timestamp).getTime() - asDate(b.timestamp).getTime()
        );
        const unread = ordered.filter((item) => item.direction === 'incoming').length;
        await this.conversations.save({
          id: phone,
          contactId: phone,
          contactName,
          contactPhone: phone,
          status: 'open',
          unreadCount: unread,
          lastMessage: ordered[ordered.length - 1],
          lastActivity: asDate(ordered[ordered.length - 1].timestamp),
          createdAt: asDate(ordered[0].timestamp),
          tags: [],
        });
        continue;
      }

      if (current.contactName !== contactName) {
        await this.conversations.save({ ...current, contactName });
      }
    }
  }
}
