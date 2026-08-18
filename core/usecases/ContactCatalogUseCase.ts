import { Contact } from '../entities/Contact';
import { IContactRepository } from '../repositories/IContactRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';
import { contactPhoneFromMessage } from './UpsertConversationFromMessageUseCase';

export class ContactCatalogUseCase extends CatalogUseCase<Contact> {
  constructor(
    repo: IContactRepository = serviceLocator.getContactRepository(),
    private messages: IMessageRepository = serviceLocator.getMessageRepository(),
    private upsertContact: UpsertContactFromIncomingUseCase = new UpsertContactFromIncomingUseCase(
      repo
    )
  ) {
    super(repo);
  }

  async list(): Promise<Contact[]> {
    const messages = await this.messages.getAll();
    const seen = new Set<string>();
    for (const message of messages) {
      const phone = contactPhoneFromMessage(message);
      if (!phone || seen.has(phone)) {
        continue;
      }
      seen.add(phone);
      await this.upsertContact.execute(phone, message.contactName);
    }
    return super.list();
  }
}
