import { Contact } from '../entities/Contact';
import { Conversation } from '../entities/Conversation';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { AVATAR_BACKFILL_BATCH } from '../entities/contactAvatarBackfill';
import { IContactRepository } from '../repositories/IContactRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { IMediaStorage, StoredMedia } from '../services/IMediaStorage';
import {
  IWhatsAppService,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { Message } from '../entities/Message';
import { SyncContactAvatarUseCase } from './SyncContactAvatarUseCase';
import { SyncMissingContactAvatarsUseCase } from './SyncMissingContactAvatarsUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';

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

class MemoryNumbers implements IWhatsAppNumberRepository {
  constructor(public items: WhatsAppNumber[] = []) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: WhatsAppNumber) {
    this.items.push(entity);
  }
  async delete() {}
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
    return { bytes: new Uint8Array([9]), mimeType: 'image/jpeg' };
  }
}

const now = new Date('2026-08-19');

function contact(id: string, avatarUrl?: string): Contact {
  return {
    id,
    name: id,
    phone: id,
    tags: [],
    avatarUrl,
    createdAt: now,
    updatedAt: now,
  };
}

function thread(phone: string, avatar?: string): Conversation {
  return {
    id: phone,
    contactId: phone,
    contactName: phone,
    contactPhone: phone,
    status: 'open',
    unreadCount: 0,
    lastActivity: now,
    createdAt: now,
    tags: [],
    contactAvatarUrl: avatar,
  };
}

function catalog(
  contacts: MemoryContacts,
  conversations: MemoryConversations,
  whatsApp: FakeWhatsApp
) {
  const storage = new MemoryStorage();
  return new SyncMissingContactAvatarsUseCase(
    conversations,
    contacts,
    new MemoryNumbers(),
    new SyncContactAvatarUseCase(contacts, conversations, storage, whatsApp),
    new UpsertContactFromIncomingUseCase(contacts)
  );
}

describe('SyncMissingContactAvatarsUseCase', () => {
  it('copia href já existente sem chamar o provedor', async () => {
    const href = '/api/contacts/5511/avatar';
    const contacts = new MemoryContacts([contact('5511', href)]);
    const conversations = new MemoryConversations([thread('5511')]);
    const whatsApp = new FakeWhatsApp();
    const result = await catalog(contacts, conversations, whatsApp).execute();
    expect(result).toEqual({ attempted: 0, filled: 1 });
    expect(conversations.items[0].contactAvatarUrl).toBe(href);
    expect(whatsApp.fetches).toBe(0);
  });

  it('busca só quem ainda não tem foto', async () => {
    const contacts = new MemoryContacts([contact('5511')]);
    const conversations = new MemoryConversations([thread('5511')]);
    const whatsApp = new FakeWhatsApp();
    const result = await catalog(contacts, conversations, whatsApp).execute();
    expect(result.filled).toBe(1);
    expect(result.attempted).toBe(1);
    expect(whatsApp.fetches).toBe(1);
    expect(conversations.items[0].contactAvatarUrl).toBe('/api/contacts/5511/avatar');
  });

  it('respeita o lote', async () => {
    const phones = Array.from({ length: AVATAR_BACKFILL_BATCH + 1 }, (_, index) => `55${index}`);
    const contacts = new MemoryContacts(phones.map((phone) => contact(phone)));
    const conversations = new MemoryConversations(phones.map((phone) => thread(phone)));
    const whatsApp = new FakeWhatsApp();
    const result = await catalog(contacts, conversations, whatsApp).execute();
    expect(result.attempted).toBe(AVATAR_BACKFILL_BATCH);
    expect(whatsApp.fetches).toBe(AVATAR_BACKFILL_BATCH);
  });
});
