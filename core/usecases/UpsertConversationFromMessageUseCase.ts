import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { lineHintFromMessage, matchWhatsAppNumber } from '../entities/whatsappNumberLine';
import { pickWhatsAppDisplayName } from '../entities/pickWhatsAppDisplayName';
import {
  conversationThreadId,
  findConversationThread,
} from '../entities/conversationThread';

export function contactPhoneFromMessage(message: Message): string {
  const phone = message.direction === 'incoming' ? message.from : message.to;
  return phone.replace(/\D/g, '') || phone;
}

function asDate(value: Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export class UpsertConversationFromMessageUseCase {
  constructor(
    private conversations: IConversationRepository,
    private contacts: IContactRepository,
    private numbers: IWhatsAppNumberRepository
  ) {}

  private async contactSnapshot(
    phone: string,
    messageName?: string
  ): Promise<{ contactName: string; contactAvatarUrl?: string }> {
    const contact = await this.contacts.getById(phone);
    return {
      contactName: pickWhatsAppDisplayName(phone, messageName, contact?.name),
      contactAvatarUrl: contact?.avatarUrl,
    };
  }

  async execute(message: Message): Promise<Conversation | null> {
    const catalog = await this.numbers.getAll();
    return this.upsertOne(message, catalog);
  }

  private async upsertOne(
    message: Message,
    catalog: WhatsAppNumber[]
  ): Promise<Conversation | null> {
    const contactPhone = contactPhoneFromMessage(message);
    if (!contactPhone) {
      return null;
    }

    const whatsappNumberId = matchWhatsAppNumber(catalog, lineHintFromMessage(message))?.id;
    const existing = findConversationThread(
      await this.conversations.getAll(),
      contactPhone,
      whatsappNumberId
    );
    const now = asDate(message.timestamp);
    const incoming = message.direction === 'incoming';
    const snapshot = await this.contactSnapshot(contactPhone, message.contactName);
    const contactName = snapshot.contactName;
    const id = existing?.id ?? conversationThreadId(contactPhone, whatsappNumberId);

    if (!existing) {
      const created: Conversation = {
        id,
        contactId: contactPhone,
        contactName,
        contactPhone,
        status: 'open',
        unreadCount: incoming ? 1 : 0,
        lastMessage: message,
        lastActivity: now,
        createdAt: now,
        tags: [],
        whatsappNumberId,
        contactAvatarUrl: snapshot.contactAvatarUrl,
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
      whatsappNumberId: whatsappNumberId ?? existing.whatsappNumberId,
      contactAvatarUrl: snapshot.contactAvatarUrl ?? existing.contactAvatarUrl,
    };
    await this.conversations.save(updated);
    return updated;
  }

  async ensureFromMessages(messages: Message[]): Promise<void> {
    const existing = await this.conversations.getAll();
    const catalog = await this.numbers.getAll();
    const have = new Map(existing.map((item) => [item.id, item]));
    const grouped = new Map<string, Message[]>();

    for (const message of messages) {
      const phone = contactPhoneFromMessage(message);
      if (!phone) {
        continue;
      }
      const lineId = matchWhatsAppNumber(catalog, lineHintFromMessage(message))?.id;
      const thread =
        findConversationThread(existing, phone, lineId) ??
        ({ id: conversationThreadId(phone, lineId) } as Conversation);
      const list = grouped.get(thread.id) ?? [];
      list.push(message);
      grouped.set(thread.id, list);
    }

    for (const [id, list] of grouped) {
      const current = have.get(id);
      const last = [...list].sort(
        (a, b) => asDate(a.timestamp).getTime() - asDate(b.timestamp).getTime()
      )[list.length - 1];
      const phone = contactPhoneFromMessage(last);
      const snapshot = await this.contactSnapshot(phone, last.contactName);
      const contactName = snapshot.contactName;
      const lineId = matchWhatsAppNumber(catalog, lineHintFromMessage(last))?.id;

      if (!current) {
        const ordered = [...list].sort(
          (a, b) => asDate(a.timestamp).getTime() - asDate(b.timestamp).getTime()
        );
        const unread = ordered.filter((item) => item.direction === 'incoming').length;
        await this.conversations.save({
          id,
          contactId: phone,
          contactName,
          contactPhone: phone,
          status: 'open',
          unreadCount: unread,
          lastMessage: ordered[ordered.length - 1],
          lastActivity: asDate(ordered[ordered.length - 1].timestamp),
          createdAt: asDate(ordered[0].timestamp),
          tags: [],
          whatsappNumberId: lineId,
          contactAvatarUrl: snapshot.contactAvatarUrl,
        });
        continue;
      }

      if (current.contactName !== contactName || current.contactAvatarUrl !== snapshot.contactAvatarUrl) {
        await this.conversations.save({
          ...current,
          contactName,
          contactAvatarUrl: snapshot.contactAvatarUrl ?? current.contactAvatarUrl,
        });
      }
    }
  }
}
