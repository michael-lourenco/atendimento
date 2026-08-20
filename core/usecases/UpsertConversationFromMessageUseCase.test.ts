import { Message } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { UpsertConversationFromMessageUseCase } from './UpsertConversationFromMessageUseCase';

class MemoryConversations implements IConversationRepository {
  items: Conversation[] = [];
  async getAll() {
    return this.items;
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
  async save(conversation: Conversation) {
    const index = this.items.findIndex((item) => item.id === conversation.id);
    if (index >= 0) {
      this.items[index] = conversation;
    } else {
      this.items.push(conversation);
    }
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

const emptyContacts = {
  async getAll() {
    return [];
  },
  async getById() {
    return null;
  },
  async save() {},
  async delete() {},
};

const emptyNumbers = {
  async getAll() {
    return [];
  },
  async getById() {
    return null;
  },
  async save() {},
  async delete() {},
};

const incoming: Message = {
  id: 'm1',
  from: '5511999999999',
  to: 'bot',
  content: 'oi',
  type: 'text',
  timestamp: new Date('2026-08-18T18:00:00Z'),
  direction: 'incoming',
  status: 'delivered',
};

describe('UpsertConversationFromMessageUseCase', () => {
  it('cria conversa open na primeira incoming', async () => {
    const repo = new MemoryConversations();
    const conversation = await new UpsertConversationFromMessageUseCase(
      repo,
      emptyContacts,
      emptyNumbers
    ).execute(incoming);
    expect(conversation?.id).toBe('5511999999999');
    expect(conversation?.status).toBe('open');
    expect(conversation?.unreadCount).toBe(1);
    expect(repo.items).toHaveLength(1);
  });

  it('reabre conversa fechada e incrementa não lidas', async () => {
    const repo = new MemoryConversations();
    const useCase = new UpsertConversationFromMessageUseCase(repo, emptyContacts, emptyNumbers);
    await useCase.execute(incoming);
    await repo.save({ ...repo.items[0], status: 'closed', unreadCount: 0 });
    const again = await useCase.execute({ ...incoming, id: 'm2' });
    expect(again?.status).toBe('open');
    expect(again?.unreadCount).toBe(1);
  });

  it('ensureFromMessages cria só o que falta, sem inflar não lidas', async () => {
    const repo = new MemoryConversations();
    const useCase = new UpsertConversationFromMessageUseCase(repo, emptyContacts, emptyNumbers);
    await useCase.ensureFromMessages([
      incoming,
      { ...incoming, id: 'm2', content: 'de novo' },
    ]);
    expect(repo.items).toHaveLength(1);
    expect(repo.items[0].unreadCount).toBe(2);
    await useCase.ensureFromMessages([incoming]);
    expect(repo.items[0].unreadCount).toBe(2);
  });

  it('usa o nome do WhatsApp na conversa', async () => {
    const repo = new MemoryConversations();
    const conversation = await new UpsertConversationFromMessageUseCase(
      repo,
      emptyContacts,
      emptyNumbers
    ).execute({
      ...incoming,
      contactName: 'Ana Lima',
    });
    expect(conversation?.contactName).toBe('Ana Lima');
  });

  it('grava a linha WhatsApp pelo instanceName', async () => {
    const repo = new MemoryConversations();
    const numbers = {
      items: [
        {
          id: 'n-com',
          name: 'Comercial',
          number: '5511000000001',
          status: 'active' as const,
          provider: 'evolution',
          instanceName: 'comercial',
          createdAt: new Date('2026-08-19'),
        },
      ],
      async getAll() {
        return this.items;
      },
      async getById(id: string) {
        return this.items.find((item) => item.id === id) ?? null;
      },
      async save() {},
      async delete() {},
    };
    const contacts = {
      async getAll() {
        return [];
      },
      async getById() {
        return null;
      },
      async save() {},
      async delete() {},
    };
    const conversation = await new UpsertConversationFromMessageUseCase(
      repo,
      contacts,
      numbers
    ).execute({
      ...incoming,
      to: 'comercial',
    });
    expect(conversation?.whatsappNumberId).toBe('n-com');
  });

  it('mesma pessoa em outra linha vira outra conversa', async () => {
    const repo = new MemoryConversations();
    const numbers = {
      items: [
        {
          id: 'n-com',
          name: 'Comercial',
          number: '5511000000001',
          status: 'active' as const,
          provider: 'evolution',
          instanceName: 'comercial',
          createdAt: new Date('2026-08-19'),
        },
        {
          id: 'n-sup',
          name: 'Suporte',
          number: '5511000000002',
          status: 'active' as const,
          provider: 'evolution',
          instanceName: 'suporte',
          createdAt: new Date('2026-08-19'),
        },
      ],
      async getAll() {
        return this.items;
      },
      async getById(id: string) {
        return this.items.find((item) => item.id === id) ?? null;
      },
      async save() {},
      async delete() {},
    };
    const contacts = {
      async getAll() {
        return [];
      },
      async getById() {
        return null;
      },
      async save() {},
      async delete() {},
    };
    const useCase = new UpsertConversationFromMessageUseCase(repo, contacts, numbers);
    const first = await useCase.execute({ ...incoming, to: 'comercial' });
    const second = await useCase.execute({ ...incoming, id: 'm2', to: 'suporte' });
    expect(first?.id).toBe('5511999999999:n-com');
    expect(second?.id).toBe('5511999999999:n-sup');
    expect(repo.items).toHaveLength(2);
    await useCase.execute({ ...incoming, id: 'm3', to: 'comercial' });
    expect(repo.items).toHaveLength(2);
    expect(repo.items.find((item) => item.whatsappNumberId === 'n-com')?.unreadCount).toBe(2);
  });

  it('legado id=telefone da mesma linha não duplica', async () => {
    const repo = new MemoryConversations();
    const numbers = {
      items: [
        {
          id: 'n-com',
          name: 'Comercial',
          number: '5511000000001',
          status: 'active' as const,
          provider: 'evolution',
          instanceName: 'comercial',
          createdAt: new Date('2026-08-19'),
        },
      ],
      async getAll() {
        return this.items;
      },
      async getById(id: string) {
        return this.items.find((item) => item.id === id) ?? null;
      },
      async save() {},
      async delete() {},
    };
    const contacts = {
      async getAll() {
        return [];
      },
      async getById() {
        return null;
      },
      async save() {},
      async delete() {},
    };
    await repo.save({
      id: '5511999999999',
      contactId: '5511999999999',
      contactName: 'Ana',
      contactPhone: '5511999999999',
      whatsappNumberId: 'n-com',
      status: 'open',
      unreadCount: 0,
      lastActivity: new Date('2026-08-18T18:00:00Z'),
      createdAt: new Date('2026-08-18T18:00:00Z'),
      tags: [],
    });
    const again = await new UpsertConversationFromMessageUseCase(repo, contacts, numbers).execute({
      ...incoming,
      to: 'comercial',
    });
    expect(again?.id).toBe('5511999999999');
    expect(repo.items).toHaveLength(1);
  });
});
