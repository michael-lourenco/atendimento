import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { GetDashboardMetricsUseCase } from './GetDashboardMetricsUseCase';

const now = new Date('2026-08-18T15:00:00Z');

function msg(partial: Partial<Message> & Pick<Message, 'id' | 'direction'>): Message {
  return {
    from: '1',
    to: '2',
    content: 'x',
    type: 'text',
    timestamp: now,
    status: 'sent',
    ...partial,
  };
}

class FakeMessages implements IMessageRepository {
  constructor(private items: Message[]) {}
  async getAll() {
    return this.items;
  }
  async getById() {
    return null;
  }
  async getByContact() {
    return [];
  }
  async save() {}
  async delete() {}
}

class FakeNumbers implements IWhatsAppNumberRepository {
  async getAll() {
    return [];
  }
  async getById() {
    return null;
  }
  async save() {}
  async delete() {}
}

class FakeConversations implements IConversationRepository {
  constructor(private items: Conversation[]) {}
  async getAll() {
    return this.items;
  }
  async getById() {
    return null;
  }
  async getByDepartment() {
    return [];
  }
  async getByAgent() {
    return [];
  }
  async save() {}
  async delete() {}
}

describe('GetDashboardMetricsUseCase', () => {
  it('calcula totais a partir das portas', async () => {
    const metrics = await new GetDashboardMetricsUseCase(
      new FakeMessages([
        msg({ id: '1', direction: 'incoming' }),
        msg({ id: '2', direction: 'incoming' }),
        msg({ id: '3', direction: 'outgoing' }),
      ]),
      new FakeConversations([
        {
          id: 'c1',
          contactId: '1',
          contactName: 'A',
          contactPhone: '1',
          status: 'open',
          unreadCount: 0,
          lastActivity: now,
          createdAt: now,
          tags: [],
        },
        {
          id: 'c2',
          contactId: '2',
          contactName: 'B',
          contactPhone: '2',
          status: 'closed',
          unreadCount: 0,
          lastActivity: now,
          createdAt: now,
          tags: [],
        },
      ]),
      new FakeNumbers()
    ).execute();

    expect(metrics).toEqual({
      totalMessages: 3,
      activeConversations: 1,
      responseRatePercent: 50,
      conversationsByDepartment: [{ name: 'Sem setor', count: 2 }],
      avgAssumeMinutes: null,
      avgFirstHumanReplyMinutes: null,
      unassignedOlderThanMinutes: 1,
    });
  });

  it('média até Assumir usa assignedAt', async () => {
    const created = new Date('2026-08-19T12:00:00Z');
    const assumed = new Date('2026-08-19T12:05:00Z');
    const metrics = await new GetDashboardMetricsUseCase(
      new FakeMessages([]),
      new FakeConversations([
        {
          id: 'c1',
          contactId: '1',
          contactName: 'A',
          contactPhone: '1',
          status: 'waiting',
          unreadCount: 0,
          lastActivity: assumed,
          createdAt: created,
          assignedAt: assumed,
          tags: [],
          departmentName: 'Comercial',
        },
      ]),
      new FakeNumbers()
    ).execute();
    expect(metrics.avgAssumeMinutes).toBe(5);
    expect(metrics.conversationsByDepartment).toEqual([{ name: 'Comercial', count: 1 }]);
  });

  it('média até 1ª resposta humana ignora o bot', async () => {
    const t0 = new Date('2026-08-19T12:00:00Z');
    const t1 = new Date('2026-08-19T12:01:00Z');
    const t2 = new Date('2026-08-19T12:04:00Z');
    const metrics = await new GetDashboardMetricsUseCase(
      new FakeMessages([
        msg({
          id: 'in',
          direction: 'incoming',
          from: '5511',
          to: 'bot',
          timestamp: t0,
        }),
        msg({
          id: 'bot',
          direction: 'outgoing',
          from: 'bot',
          to: '5511',
          timestamp: t1,
          flowId: 'inicio',
          stepId: 'welcome',
        }),
        msg({
          id: 'human',
          direction: 'outgoing',
          from: 'bot',
          to: '5511',
          timestamp: t2,
        }),
      ]),
      new FakeConversations([
        {
          id: '5511',
          contactId: '5511',
          contactName: 'A',
          contactPhone: '5511',
          status: 'waiting',
          unreadCount: 0,
          lastActivity: t2,
          createdAt: t0,
          tags: [],
        },
      ]),
      new FakeNumbers()
    ).execute();
    expect(metrics.avgFirstHumanReplyMinutes).toBe(4);
  });
});
