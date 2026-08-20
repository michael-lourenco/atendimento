import { Chatbot } from '../entities/Chatbot';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { ChatbotCatalogUseCase } from './ChatbotCatalogUseCase';

const now = new Date('2026-08-20T16:00:00Z');

function bot(id: string, isActive: boolean): Chatbot {
  return {
    id,
    name: id,
    isActive,
    messagesCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

class FakeRepo implements IChatbotRepository {
  constructor(private items: Chatbot[]) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: Chatbot) {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) {
      this.items[index] = entity;
    } else {
      this.items.push(entity);
    }
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

describe('ChatbotCatalogUseCase', () => {
  it('gravar ativo desativa os outros', async () => {
    const repo = new FakeRepo([bot('a', true), bot('b', false)]);
    const catalog = new ChatbotCatalogUseCase(repo);
    await catalog.save({ ...bot('b', true), updatedAt: now });
    const listed = await catalog.list();
    expect(listed.find((item) => item.id === 'a')?.isActive).toBe(false);
    expect(listed.find((item) => item.id === 'b')?.isActive).toBe(true);
  });

  it('desligar o ativo não mexe nos outros', async () => {
    const repo = new FakeRepo([bot('a', true), bot('b', false)]);
    const catalog = new ChatbotCatalogUseCase(repo);
    await catalog.save(bot('a', false));
    expect((await catalog.getById('b'))?.isActive).toBe(false);
  });
});
