import { Conversation } from '../../core/entities/Conversation';
import { IConversationRepository } from '../../core/repositories/IConversationRepository';

export class MockConversationRepository implements IConversationRepository {
  private conversations: Conversation[] = [
    {
      id: '1',
      contactId: '1',
      contactName: 'João Silva',
      contactPhone: '5511999999999',
      departmentId: '1',
      departmentName: 'Comercial',
      assignedAgentId: '1',
      assignedAgentName: 'Michael',
      status: 'open',
      unreadCount: 2,
      lastActivity: new Date('2024-01-15T10:30:00'),
      createdAt: new Date('2024-01-15T09:00:00'),
      tags: ['cliente'],
    },
    {
      id: '2',
      contactId: '2',
      contactName: 'Maria Santos',
      contactPhone: '5511888888888',
      departmentId: '2',
      departmentName: 'Demonstração',
      assignedAgentId: '2',
      assignedAgentName: 'Atendente',
      status: 'open',
      unreadCount: 0,
      lastActivity: new Date('2024-01-15T11:00:00'),
      createdAt: new Date('2024-01-15T10:00:00'),
      tags: ['demo'],
    },
    {
      id: '3',
      contactId: '3',
      contactName: 'Pedro Oliveira',
      contactPhone: '5511777777777',
      departmentId: '1',
      departmentName: 'Comercial',
      status: 'open',
      unreadCount: 1,
      lastActivity: new Date('2024-01-15T12:00:00'),
      createdAt: new Date('2024-01-15T11:30:00'),
      tags: ['lead'],
    },
    {
      id: '4',
      contactId: '4',
      contactName: 'Ana Costa',
      contactPhone: '5511666666666',
      departmentId: '2',
      departmentName: 'Demonstração',
      assignedAgentId: '1',
      assignedAgentName: 'Michael',
      status: 'waiting',
      unreadCount: 0,
      lastActivity: new Date('2024-01-15T09:30:00'),
      createdAt: new Date('2024-01-15T08:00:00'),
      tags: ['demo'],
    },
    {
      id: '5',
      contactId: '5',
      contactName: 'Carlos Mendes',
      contactPhone: '5511555555555',
      departmentId: '3',
      departmentName: 'Cliente',
      assignedAgentId: '2',
      assignedAgentName: 'Atendente',
      status: 'closed',
      unreadCount: 0,
      lastActivity: new Date('2024-01-14T16:00:00'),
      createdAt: new Date('2024-01-14T14:00:00'),
      tags: ['cliente'],
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
    return [...this.conversations].sort(
      (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
    );
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.conversations.find((item) => item.id === id) ?? null;
  }

  async getByDepartment(departmentId: string): Promise<Conversation[]> {
    return this.conversations
      .filter((item) => item.departmentId === departmentId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async getByAgent(agentId: string): Promise<Conversation[]> {
    return this.conversations
      .filter((item) => item.assignedAgentId === agentId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async save(conversation: Conversation): Promise<void> {
    const index = this.conversations.findIndex((item) => item.id === conversation.id);
    if (index >= 0) {
      this.conversations[index] = conversation;
    } else {
      this.conversations.push(conversation);
    }
  }

  async delete(id: string): Promise<void> {
    this.conversations = this.conversations.filter((item) => item.id !== id);
  }
}

export const mockConversationRepository = new MockConversationRepository();
