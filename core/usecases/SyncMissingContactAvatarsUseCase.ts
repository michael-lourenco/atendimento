import { IContactRepository } from '../repositories/IContactRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import {
  AVATAR_BACKFILL_BATCH,
  conversationContactPhone,
  conversationsNeedingAvatarPhoto,
} from '../entities/contactAvatarBackfill';
import { SyncContactAvatarUseCase } from './SyncContactAvatarUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';

export class SyncMissingContactAvatarsUseCase {
  constructor(
    private conversations: IConversationRepository,
    private contacts: IContactRepository,
    private numbers: IWhatsAppNumberRepository,
    private syncAvatar: SyncContactAvatarUseCase,
    private upsertContact: UpsertContactFromIncomingUseCase
  ) {}

  async execute(): Promise<{ attempted: number; filled: number }> {
    const [threads, contactList, numberList] = await Promise.all([
      this.conversations.getAll(),
      this.contacts.getAll(),
      this.numbers.getAll(),
    ]);
    const byId = new Map(contactList.map((item) => [item.id, item]));
    let filled = 0;

    for (const thread of threads) {
      if (thread.contactAvatarUrl?.trim()) {
        continue;
      }
      const contact = byId.get(conversationContactPhone(thread));
      if (!contact?.avatarUrl) {
        continue;
      }
      await this.conversations.save({ ...thread, contactAvatarUrl: contact.avatarUrl });
      filled += 1;
    }

    const remaining = conversationsNeedingAvatarPhoto(
      await this.conversations.getAll(),
      numberList
    ).slice(0, AVATAR_BACKFILL_BATCH);

    for (const target of remaining) {
      try {
        await this.upsertContact.execute(target.phone, target.name);
        const before = (await this.contacts.getById(target.phone))?.avatarUrl;
        const after = await this.syncAvatar.execute(target.phone, target.instanceName);
        if (after?.avatarUrl && after.avatarUrl !== before) {
          filled += 1;
        }
      } catch {
        // um contato sem foto não interrompe o lote
      }
    }

    return { attempted: remaining.length, filled };
  }
}
