import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import {
  IWhatsAppService,
  SendMessageParams,
  SendReactionParams,
  WhatsAppMessageResponse,
  WhatsAppWebhookEntry,
} from '../services/IWhatsAppService';
import { SendMessageReactionUseCase } from './SendMessageReactionUseCase';

const now = new Date('2026-08-20T12:00:00Z');

const sample: Message = {
  id: 'm1',
  from: '5511999999999',
  to: 'comercial',
  content: 'oi',
  type: 'text',
  timestamp: now,
  direction: 'incoming',
  status: 'delivered',
};

class MemoryMessages implements IMessageRepository {
  constructor(private items: Message[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async getByContact() {
    return this.items;
  }
  async save(message: Message) {
    this.items = [...this.items.filter((item) => item.id !== message.id), message];
  }
  async delete() {}
}

class FakeWhatsApp implements IWhatsAppService {
  sent: SendReactionParams[] = [];
  async sendMessage(_params: SendMessageParams): Promise<WhatsAppMessageResponse> {
    return { messaging_product: 'whatsapp', contacts: [], messages: [] };
  }
  async sendReaction(params: SendReactionParams) {
    this.sent.push(params);
  }
  verifyWebhook() {
    return null;
  }
  async processWebhook(_entry: WhatsAppWebhookEntry): Promise<Message[]> {
    return [];
  }
  async fetchProfilePicture() {
    return null;
  }
}

describe('SendMessageReactionUseCase', () => {
  it('envia e persiste a reação da linha', async () => {
    const whatsApp = new FakeWhatsApp();
    const messages = new MemoryMessages([{ ...sample }]);
    const updated = await new SendMessageReactionUseCase(whatsApp, messages).execute({
      messageId: 'm1',
      emoji: '👍',
    });
    expect(whatsApp.sent).toEqual([
      {
        to: '5511999999999',
        messageId: 'm1',
        emoji: '👍',
        fromMe: false,
        instanceName: 'comercial',
      },
    ]);
    expect(updated?.reactions).toEqual([{ emoji: '👍', from: 'comercial' }]);
  });

  it('mesmo emoji da linha remove', async () => {
    const whatsApp = new FakeWhatsApp();
    const messages = new MemoryMessages([
      { ...sample, reactions: [{ emoji: '👍', from: 'comercial' }] },
    ]);
    const updated = await new SendMessageReactionUseCase(whatsApp, messages).execute({
      messageId: 'm1',
      emoji: '👍',
    });
    expect(whatsApp.sent[0].emoji).toBe('');
    expect(updated?.reactions).toEqual([]);
  });
});
