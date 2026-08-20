import { pickWhatsAppDisplayName } from '../entities/pickWhatsAppDisplayName';
import { Contact } from '../entities/Contact';
import { IContactRepository } from '../repositories/IContactRepository';

export class UpsertContactFromIncomingUseCase {
  constructor(private contacts: IContactRepository) {}

  async execute(phone: string, name?: string): Promise<Contact | null> {
    const id = phone.replace(/\D/g, '') || phone;
    if (!id) {
      return null;
    }

    const existing = await this.contacts.getById(id);
    const now = new Date();
    const resolvedName = pickWhatsAppDisplayName(id, name, existing?.name);

    if (!existing) {
      const created: Contact = {
        id,
        name: resolvedName,
        phone: id,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      await this.contacts.save(created);
      return created;
    }

    if (existing.name === resolvedName) {
      return existing;
    }

    const updated: Contact = {
      ...existing,
      name: resolvedName,
      phone: existing.phone || id,
      updatedAt: now,
    };
    await this.contacts.save(updated);
    return updated;
  }
}
