import { Conversation } from './Conversation';
import { unassignedOlderThanMinutes } from './slaMetrics';

const row = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: '1',
  contactId: '1',
  contactName: 'A',
  contactPhone: '1',
  status: 'open',
  unreadCount: 0,
  lastActivity: new Date('2026-08-19T12:00:00Z'),
  createdAt: new Date('2026-08-19T12:00:00Z'),
  tags: [],
  ...overrides,
});

describe('unassignedOlderThanMinutes', () => {
  const now = new Date('2026-08-19T12:10:00Z');

  it('conta abertas sem dono acima do limiar', () => {
    expect(
      unassignedOlderThanMinutes(
        [
          row({ id: 'old', createdAt: new Date('2026-08-19T12:00:00Z') }),
          row({
            id: 'fresh',
            createdAt: new Date('2026-08-19T12:08:00Z'),
          }),
          row({
            id: 'mine',
            assignedAgentId: 'a1',
            createdAt: new Date('2026-08-19T12:00:00Z'),
          }),
          row({
            id: 'done',
            status: 'closed',
            createdAt: new Date('2026-08-19T12:00:00Z'),
          }),
        ],
        5,
        now
      )
    ).toBe(1);
  });
});
