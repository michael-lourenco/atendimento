import { Conversation } from './Conversation';
import { queuePlace, queuePlaceLine } from './queuePlace';

const now = new Date('2026-08-19T12:00:00Z');

function conv(partial: Partial<Conversation> & Pick<Conversation, 'id'>): Conversation {
  return {
    contactId: partial.id,
    contactName: partial.id,
    contactPhone: partial.id,
    status: 'open',
    unreadCount: 0,
    lastActivity: now,
    createdAt: now,
    tags: [],
    ...partial,
  };
}

describe('queuePlace', () => {
  it('conta só o mesmo setor sem atendente', () => {
    const current = conv({
      id: 'b',
      departmentId: '1',
      lastActivity: new Date('2026-08-19T12:02:00Z'),
    });
    const place = queuePlace(
      [
        conv({ id: 'a', departmentId: '1', lastActivity: new Date('2026-08-19T12:00:00Z') }),
        current,
        conv({ id: 'c', departmentId: '2', lastActivity: new Date('2026-08-19T12:01:00Z') }),
        conv({
          id: 'd',
          departmentId: '1',
          assignedAgentId: 'ag',
          lastActivity: new Date('2026-08-19T11:00:00Z'),
        }),
      ],
      current
    );
    expect(place).toBe(2);
    expect(queuePlaceLine(place)).toBe('Você é o 2 na fila.');
  });
});
