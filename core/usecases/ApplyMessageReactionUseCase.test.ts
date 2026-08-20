import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { ApplyMessageReactionUseCase } from './ApplyMessageReactionUseCase';

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

describe('ApplyMessageReactionUseCase', () => {
  it('grava no alvo', async () => {
    const messages = new MemoryMessages([{ ...sample }]);
    const updated = await new ApplyMessageReactionUseCase(messages).execute({
      targetId: 'm1',
      from: '5511999999999',
      emoji: '👍',
    });
    expect(updated?.reactions).toEqual([{ emoji: '👍', from: '5511999999999' }]);
  });

  it('alvo inexistente retorna null', async () => {
    const updated = await new ApplyMessageReactionUseCase(new MemoryMessages([])).execute({
      targetId: 'missing',
      from: '5511',
      emoji: '👍',
    });
    expect(updated).toBeNull();
  });
});
