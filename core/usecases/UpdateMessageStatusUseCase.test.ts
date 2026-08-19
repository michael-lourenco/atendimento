import { Message } from '../entities/Message';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { UpdateMessageStatusUseCase } from './UpdateMessageStatusUseCase';

class MemoryMessages implements IMessageRepository {
  items: Message[] = [];
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
    const index = this.items.findIndex((item) => item.id === message.id);
    if (index >= 0) this.items[index] = message;
    else this.items.push(message);
  }
  async delete() {}
}

const outgoing = (): Message => ({
  id: 'wamid-1',
  from: 'bot',
  to: '5511999',
  content: 'oi',
  type: 'text',
  timestamp: new Date(),
  direction: 'outgoing',
  status: 'sent',
});

describe('UpdateMessageStatusUseCase', () => {
  it('avança sent para delivered', async () => {
    const repo = new MemoryMessages();
    repo.items.push(outgoing());
    const updated = await new UpdateMessageStatusUseCase(repo).execute('wamid-1', 'delivered');
    expect(updated?.status).toBe('delivered');
  });

  it('não rebaixa lida para enviada', async () => {
    const repo = new MemoryMessages();
    repo.items.push({ ...outgoing(), status: 'read' });
    const updated = await new UpdateMessageStatusUseCase(repo).execute('wamid-1', 'sent');
    expect(updated?.status).toBe('read');
  });

  it('ignora id desconhecido', async () => {
    const repo = new MemoryMessages();
    expect(await new UpdateMessageStatusUseCase(repo).execute('x', 'read')).toBeNull();
  });
});
