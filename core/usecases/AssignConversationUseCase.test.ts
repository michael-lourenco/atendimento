import { Conversation } from '../entities/Conversation';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { AssignConversationUseCase } from './AssignConversationUseCase';
import { CloseConversationUseCase } from './CloseConversationUseCase';
import { assignmentFromOperator } from '../entities/assignmentFromOperator';

class FakeConversations implements IConversationRepository {
  constructor(private items: Conversation[]) {}
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
  async delete() {}
}

const now = new Date('2026-08-18T15:00:00Z');

function openConversation(): Conversation {
  return {
    id: '5521982790723',
    contactId: '5521982790723',
    contactName: 'Cliente',
    contactPhone: '5521982790723',
    status: 'open',
    unreadCount: 1,
    lastActivity: now,
    createdAt: now,
    tags: [],
  };
}

describe('AssignConversationUseCase', () => {
  it('assume a conversa e manda para waiting', async () => {
    const repo = new FakeConversations([openConversation()]);
    const updated = await new AssignConversationUseCase(repo).execute({
      conversationId: '5521982790723',
      agentId: '1',
      agentName: 'Ana Silva',
    });

    expect(updated?.status).toBe('waiting');
    expect(updated?.assignedAgentId).toBe('1');
    expect(updated?.assignedAgentName).toBe('Ana Silva');
  });

  it('copia setor do agente se a conversa não tiver', async () => {
    const repo = new FakeConversations([openConversation()]);
    const updated = await new AssignConversationUseCase(repo).execute({
      conversationId: '5521982790723',
      agentId: '1',
      agentName: 'Ana Silva',
      departmentId: '1',
      departmentName: 'Vendas',
    });
    expect(updated?.departmentId).toBe('1');
    expect(updated?.departmentName).toBe('Vendas');
  });

  it('não sobrescreve setor já definido', async () => {
    const repo = new FakeConversations([
      { ...openConversation(), departmentId: '2', departmentName: 'Suporte' },
    ]);
    const updated = await new AssignConversationUseCase(repo).execute({
      conversationId: '5521982790723',
      agentId: '1',
      agentName: 'Ana Silva',
      departmentId: '1',
      departmentName: 'Vendas',
    });
    expect(updated?.departmentId).toBe('2');
    expect(updated?.departmentName).toBe('Suporte');
  });

  it('cria conversa se ainda não existir', async () => {
    const repo = new FakeConversations([]);
    const updated = await new AssignConversationUseCase(repo).execute({
      conversationId: '5521',
      agentId: 'u1',
      agentName: 'Operador',
    });
    expect(updated?.id).toBe('5521');
    expect(updated?.status).toBe('waiting');
  });
});

describe('CloseConversationUseCase', () => {
  it('fecha a conversa', async () => {
    const repo = new FakeConversations([openConversation()]);
    const updated = await new CloseConversationUseCase(repo).execute('5521982790723');
    expect(updated?.status).toBe('closed');
  });

  it('retorna null se não existir', async () => {
    const updated = await new CloseConversationUseCase(new FakeConversations([])).execute('x');
    expect(updated).toBeNull();
  });
});

describe('assignmentFromOperator', () => {
  it('usa o agente do catálogo com o mesmo e-mail', () => {
    const assignment = assignmentFromOperator(
      { id: 'uuid', email: 'ana@example.com', name: 'Admin' },
      [
        {
          id: '1',
          name: 'Ana Silva',
          email: 'ana@example.com',
          status: 'online',
          departmentId: '1',
          conversationsCount: 0,
          responseTime: '',
          createdAt: now,
        },
      ]
    );
    expect(assignment).toEqual({
      agentId: '1',
      agentName: 'Ana Silva',
      departmentId: '1',
      linked: true,
    });
  });
});
