import { Contact } from '../entities/Contact';
import { Conversation } from '../entities/Conversation';
import { IContactRepository } from '../repositories/IContactRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMediaStorage, StoredMedia, contactAvatarPath } from '../services/IMediaStorage';
import {
  IWhatsAppService,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { Message } from '../entities/Message';
import { SyncContactAvatarUseCase } from './SyncContactAvatarUseCase';

class MemoryContacts implements IContactRepository {
  constructor(public items: Contact[] = []) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: Contact) {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) this.items[index] = entity;
    else this.items.push(entity);
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

class MemoryConversations implements IConversationRepository {
  constructor(public items: Conversation[] = []) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async getByDepartment() {
    return [];
  }
  async getByAgent() {
    return [];
  }
  async save(entity: Conversation) {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) this.items[index] = entity;
    else this.items.push(entity);
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

class MemoryStorage implements IMediaStorage {
  files = new Map<string, StoredMedia>();
  async save(path: string, media: StoredMedia) {
    this.files.set(path, media);
  }
  async get(path: string) {
    return this.files.get(path) ?? null;
  }
}

class FakeWhatsApp implements IWhatsAppService {
  picture: StoredMedia | null = {
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: 'image/jpeg',
  };
  fetches = 0;
  async sendMessage(_params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    return { messaging_product: 'whatsapp', contacts: [], messages: [] };
  }
  verifyWebhook(): string | null {
    return null;
  }
  async processWebhook(_entry: WhatsAppWebhookEntry): Promise<Message[]> {
    return [];
  }
  async fetchProfilePicture() {
    this.fetches += 1;
    return this.picture;
  }
}

const now = new Date('2026-08-19');

const maria: Contact = {
  id: '5511999',
  name: 'Maria',
  phone: '5511999',
  tags: [],
  createdAt: now,
  updatedAt: now,
};

describe('SyncContactAvatarUseCase', () => {
  it('grava foto no storage e no contato', async () => {
    const contacts = new MemoryContacts([maria]);
    const conversations = new MemoryConversations([
      {
        id: '5511999',
        contactId: '5511999',
        contactName: 'Maria',
        contactPhone: '5511999',
        status: 'open',
        unreadCount: 0,
        lastActivity: now,
        createdAt: now,
        tags: [],
      },
    ]);
    const storage = new MemoryStorage();
    const whatsApp = new FakeWhatsApp();
    const updated = await new SyncContactAvatarUseCase(
      contacts,
      conversations,
      storage,
      whatsApp
    ).execute('5511999');
    expect(updated?.avatarUrl).toBe('/api/contacts/5511999/avatar');
    expect(storage.files.has(contactAvatarPath('5511999'))).toBe(true);
    expect(conversations.items[0].contactAvatarUrl).toBe('/api/contacts/5511999/avatar');
    expect(whatsApp.fetches).toBe(1);
  });

  it('não refaz se já houver avatarUrl', async () => {
    const contacts = new MemoryContacts([{ ...maria, avatarUrl: '/api/contacts/5511999/avatar' }]);
    const whatsApp = new FakeWhatsApp();
    await new SyncContactAvatarUseCase(
      contacts,
      new MemoryConversations(),
      new MemoryStorage(),
      whatsApp
    ).execute('5511999');
    expect(whatsApp.fetches).toBe(0);
  });

  it('falha do provedor não quebra', async () => {
    const contacts = new MemoryContacts([maria]);
    const whatsApp = new FakeWhatsApp();
    whatsApp.picture = null;
    const result = await new SyncContactAvatarUseCase(
      contacts,
      new MemoryConversations(),
      new MemoryStorage(),
      whatsApp
    ).execute('5511999');
    expect(result?.avatarUrl).toBeUndefined();
    expect(contacts.items[0].avatarUrl).toBeUndefined();
  });
});
