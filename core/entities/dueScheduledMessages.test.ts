import { ScheduledMessage } from './ScheduledMessage';
import { dueScheduledMessages } from './dueScheduledMessages';

const pending = (overrides: Partial<ScheduledMessage> = {}): ScheduledMessage => ({
  id: 's1',
  contact: '5511999',
  message: 'oi',
  scheduledDate: new Date('2026-08-18T12:00:00'),
  status: 'pending',
  createdAt: new Date('2026-08-18T10:00:00'),
  ...overrides,
});

describe('dueScheduledMessages', () => {
  const now = new Date('2026-08-18T15:00:00');

  it('só pega pendente cuja hora já passou', () => {
    const due = dueScheduledMessages(
      [
        pending({ id: 'past' }),
        pending({
          id: 'future',
          scheduledDate: new Date('2026-08-19T12:00:00'),
        }),
        pending({ id: 'done', status: 'sent' }),
      ],
      now
    );
    expect(due.map((item) => item.id)).toEqual(['past']);
  });
});
