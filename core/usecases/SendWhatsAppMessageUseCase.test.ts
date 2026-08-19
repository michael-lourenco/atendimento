import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import {
  IWhatsAppService,
  SendMessageParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { MockMediaStorage } from '../../infra/mocks/MockMediaStorage';
import { messageMediaPath } from '../services/IMediaStorage';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';

class InMemoryMessageRepository implements IMessageRepository {
  messages: Message[] = [];
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

class FakeWhatsAppService implements IWhatsAppService {
  sent: SendMessageParams[] = [];
  async sendMessage(params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    this.sent.push(params);
    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: params.to, wa_id: params.to }],
      messages: [{ id: `wamid-${this.sent.length}` }],
    };
  }
  verifyWebhook(): string | null {
    return null;
  }
  async processWebhook(_entry: WhatsAppWebhookEntry): Promise<Message[]> {
    return [];
  }
}

describe('SendWhatsAppMessageUseCase', () => {
  it('persiste outgoing de texto', async () => {
    const whatsApp = new FakeWhatsAppService();
    const messages = new InMemoryMessageRepository();
    const useCase = new SendWhatsAppMessageUseCase(whatsApp, messages);

    const result = await useCase.execute({
      to: '5521982790723',
      message: 'Olá',
    });

    expect(result.direction).toBe('outgoing');
    expect(result.type).toBe('text');
    expect(result.content).toBe('Olá');
    expect(messages.messages).toHaveLength(1);
    expect(whatsApp.sent[0].media).toBeUndefined();
  });

  it('grava mídia no storage e usa a legenda', async () => {
    const whatsApp = new FakeWhatsAppService();
    const messages = new InMemoryMessageRepository();
    const storage = new MockMediaStorage();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const useCase = new SendWhatsAppMessageUseCase(
      whatsApp,
      messages,
      null,
      null,
      storage
    );

    const result = await useCase.execute({
      to: '5521982790723',
      message: 'veja',
      media: { mimeType: 'image/jpeg', fileName: 'foto.jpg', bytes },
    });

    expect(result.type).toBe('image');
    expect(result.content).toBe('veja');
    expect(whatsApp.sent[0].media?.fileName).toBe('foto.jpg');
    const saved = await storage.get(messageMediaPath(result.id));
    expect(saved?.mimeType).toBe('image/jpeg');
    expect(Array.from(saved?.bytes ?? [])).toEqual([1, 2, 3, 4]);
  });

  it('sem legenda usa texto padrão do tipo', async () => {
    const whatsApp = new FakeWhatsAppService();
    const messages = new InMemoryMessageRepository();
    const useCase = new SendWhatsAppMessageUseCase(whatsApp, messages);

    const result = await useCase.execute({
      to: '5521982790723',
      message: '  ',
      media: {
        mimeType: 'audio/ogg',
        fileName: 'voz.ogg',
        bytes: new Uint8Array([9]),
      },
    });

    expect(result.type).toBe('audio');
    expect(result.content).toBe('Áudio enviado');
    expect(whatsApp.sent[0].message).toBe('');
  });
});
