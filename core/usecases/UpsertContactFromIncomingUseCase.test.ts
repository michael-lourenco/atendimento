import { Contact } from '../entities/Contact';
import { IContactRepository } from '../repositories/IContactRepository';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';

class MemoryContacts implements IContactRepository {
  items: Contact[] = [];
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(contact: Contact) {
    const index = this.items.findIndex((item) => item.id === contact.id);
    if (index >= 0) {
      this.items[index] = contact;
    } else {
      this.items.push(contact);
    }
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

describe('UpsertContactFromIncomingUseCase', () => {
  it('cria contato com nome do WhatsApp', async () => {
    const repo = new MemoryContacts();
    const contact = await new UpsertContactFromIncomingUseCase(repo).execute(
      '5511999999999',
      'Maria Silva'
    );
    expect(contact?.id).toBe('5511999999999');
    expect(contact?.name).toBe('Maria Silva');
    expect(contact?.phone).toBe('5511999999999');
  });

  it('não troca nome real por número', async () => {
    const repo = new MemoryContacts();
    const useCase = new UpsertContactFromIncomingUseCase(repo);
    await useCase.execute('5511999999999', 'Maria Silva');
    const again = await useCase.execute('5511999999999', '5511999999999');
    expect(again?.name).toBe('Maria Silva');
  });
});
