import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IMediaStorage, StoredMedia } from '../services/IMediaStorage';
import {
  IWhatsAppService,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { GetMessageMediaUseCase } from './GetMessageMediaUseCase';

class InMemoryMessageRepository implements IMessageRepository {
  constructor(public messages: Message[] = []) {}
  async getAll() {
    return this.messages;
  }
  async getById(id: string) {
    return this.messages.find((message) => message.id === id) ?? null;
  }
  async getByContact() {
    return this.messages;
  }
  async save(message: Message) {
    this.messages.push(message);
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
  downloads = 0;
  constructor(private withDownload: boolean) {}

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
    return null;
  }
  downloadMedia = this.withDownload
    ? async (): Promise<StoredMedia | null> => {
        this.downloads += 1;
        return { bytes: new Uint8Array([1, 2]), mimeType: 'audio/ogg' };
      }
    : undefined;
}

function audioMessage(): Message {
  return {
    id: 'aud1',
    from: '5521982790723',
    to: 'default',
    content: 'Áudio recebido',
    type: 'audio',
    timestamp: new Date('2024-01-15T10:00:00'),
    direction: 'incoming',
    status: 'delivered',
  };
}

describe('GetMessageMediaUseCase', () => {
  it('usa cache e não baixa de novo', async () => {
    const storage = new MemoryStorage();
    await storage.save('messages/aud1', { bytes: new Uint8Array([9]), mimeType: 'audio/ogg' });
    const whatsApp = new FakeWhatsApp(true);
    const file = await new GetMessageMediaUseCase(
      new InMemoryMessageRepository([audioMessage()]),
      storage,
      whatsApp
    ).execute('aud1');
    expect(whatsApp.downloads).toBe(0);
    expect(file?.bytes[0]).toBe(9);
  });

  it('não baixa se o provedor não tiver downloadMedia', async () => {
    const storage = new MemoryStorage();
    const whatsApp = new FakeWhatsApp(false);
    const file = await new GetMessageMediaUseCase(
      new InMemoryMessageRepository([audioMessage()]),
      storage,
      whatsApp
    ).execute('aud1');
    expect(file).toBeNull();
    expect(storage.files.size).toBe(0);
  });

  it('baixa, cacheia e devolve bytes', async () => {
    const storage = new MemoryStorage();
    const whatsApp = new FakeWhatsApp(true);
    const file = await new GetMessageMediaUseCase(
      new InMemoryMessageRepository([audioMessage()]),
      storage,
      whatsApp
    ).execute('aud1');
    expect(whatsApp.downloads).toBe(1);
    expect(file?.mimeType).toBe('audio/ogg');
    expect(storage.files.get('messages/aud1')?.bytes[0]).toBe(1);
  });
});
