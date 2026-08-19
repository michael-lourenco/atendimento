import { Contact } from '../entities/Contact';
import { IContactRepository } from '../repositories/IContactRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMediaStorage, contactAvatarApiHref, contactAvatarPath } from '../services/IMediaStorage';
import { IWhatsAppService } from '../services/IWhatsAppService';

export class SyncContactAvatarUseCase {
  constructor(
    private contacts: IContactRepository,
    private conversations: IConversationRepository,
    private storage: IMediaStorage,
    private whatsApp: IWhatsAppService
  ) {}

  async execute(phone: string, instanceName?: string): Promise<Contact | null> {
    const id = phone.replace(/\D/g, '') || phone;
    if (!id) {
      return null;
    }
    const contact = await this.contacts.getById(id);
    if (!contact) {
      return null;
    }
    if (contact.avatarUrl) {
      return contact;
    }
    const media = await this.whatsApp.fetchProfilePicture(id, instanceName);
    if (!media) {
      return contact;
    }
    await this.storage.save(contactAvatarPath(contact.id), media);
    const avatarUrl = contactAvatarApiHref(contact.id);
    const updated: Contact = { ...contact, avatarUrl, updatedAt: new Date() };
    await this.contacts.save(updated);
    const threads = (await this.conversations.getAll()).filter(
      (item) => item.contactId === contact.id || item.contactPhone === contact.phone
    );
    await Promise.all(
      threads
        .filter((item) => item.contactAvatarUrl !== avatarUrl)
        .map((item) => this.conversations.save({ ...item, contactAvatarUrl: avatarUrl }))
    );
    return updated;
  }
}
