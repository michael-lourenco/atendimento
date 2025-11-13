import { Conversation } from '../../core/entities/Conversation';

export interface IConversationRepository {
  getAll(): Promise<Conversation[]>;
  getById(id: string): Promise<Conversation | null>;
  getByDepartment(departmentId: string): Promise<Conversation[]>;
  getByAgent(agentId: string): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<void>;
  delete(id: string): Promise<void>;
}

export class MockConversationRepository implements IConversationRepository {
  private conversations: Conversation[] = [
    {
      id: '1',
      contactId: '1',
      contactName: 'João Silva',
      contactPhone: '5511999999999',
      departmentId: '1',
      departmentName: 'Vendas',
      assignedAgentId: '1',
      assignedAgentName: 'Ana Silva',
      status: 'open',
      unreadCount: 2,
      lastActivity: new Date('2024-01-15T10:30:00'),
      createdAt: new Date('2024-01-15T09:00:00'),
      tags: ['Cliente', 'VIP'],
    },
    {
      id: '2',
      contactId: '2',
      contactName: 'Maria Santos',
      contactPhone: '5511888888888',
      departmentId: '2',
      departmentName: 'Suporte',
      assignedAgentId: '2',
      assignedAgentName: 'Carlos Santos',
      status: 'open',
      unreadCount: 0,
      lastActivity: new Date('2024-01-15T11:00:00'),
      createdAt: new Date('2024-01-15T10:00:00'),
      tags: ['Cliente'],
    },
    {
      id: '3',
      contactId: '3',
      contactName: 'Pedro Oliveira',
      contactPhone: '5511777777777',
      departmentId: '1',
      departmentName: 'Vendas',
      status: 'open',
      unreadCount: 1,
      lastActivity: new Date('2024-01-15T12:00:00'),
      createdAt: new Date('2024-01-15T11:30:00'),
      tags: ['Prospecto'],
    },
    {
      id: '4',
      contactId: '4',
      contactName: 'Ana Costa',
      contactPhone: '5511666666666',
      departmentId: '2',
      departmentName: 'Suporte',
      assignedAgentId: '1',
      assignedAgentName: 'Ana Silva',
      status: 'waiting',
      unreadCount: 0,
      lastActivity: new Date('2024-01-15T09:30:00'),
      createdAt: new Date('2024-01-15T08:00:00'),
      tags: ['Cliente'],
    },
    {
      id: '5',
      contactId: '5',
      contactName: 'Carlos Mendes',
      contactPhone: '5511555555555',
      departmentId: '3',
      departmentName: 'Financeiro',
      assignedAgentId: '2',
      assignedAgentName: 'Carlos Santos',
      status: 'closed',
      unreadCount: 0,
      lastActivity: new Date('2024-01-14T16:00:00'),
      createdAt: new Date('2024-01-14T14:00:00'),
      tags: ['Cliente'],
    },
    {
      id: '6',
      contactId: '6',
      contactName: 'Fernanda Lima',
      contactPhone: '5511444444444',
      status: 'open',
      unreadCount: 3,
      lastActivity: new Date('2024-01-15T13:00:00'),
      createdAt: new Date('2024-01-15T12:30:00'),
      tags: [],
    },
  ];

  async getAll(): Promise<Conversation[]> {
    return Promise.resolve(this.conversations.sort((a, b) => 
      b.lastActivity.getTime() - a.lastActivity.getTime()
    ));
  }

  async getById(id: string): Promise<Conversation | null> {
    const conversation = this.conversations.find(c => c.id === id);
    return Promise.resolve(conversation || null);
  }

  async getByDepartment(departmentId: string): Promise<Conversation[]> {
    const deptConversations = this.conversations.filter(
      c => c.departmentId === departmentId
    );
    return Promise.resolve(deptConversations.sort((a, b) => 
      b.lastActivity.getTime() - a.lastActivity.getTime()
    ));
  }

  async getByAgent(agentId: string): Promise<Conversation[]> {
    const agentConversations = this.conversations.filter(
      c => c.assignedAgentId === agentId
    );
    return Promise.resolve(agentConversations.sort((a, b) => 
      b.lastActivity.getTime() - a.lastActivity.getTime()
    ));
  }

  async save(conversation: Conversation): Promise<void> {
    const existingIndex = this.conversations.findIndex(c => c.id === conversation.id);
    if (existingIndex >= 0) {
      this.conversations[existingIndex] = conversation;
    } else {
      this.conversations.push(conversation);
    }
    return Promise.resolve();
  }

  async delete(id: string): Promise<void> {
    this.conversations = this.conversations.filter(c => c.id !== id);
    return Promise.resolve();
  }
}

export const mockConversationRepository = new MockConversationRepository();

