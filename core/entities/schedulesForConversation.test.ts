import { ScheduledMessage } from './ScheduledMessage';
import { schedulesForConversation } from './schedulesForConversation';

const row = (overrides: Partial<ScheduledMessage> = {}): ScheduledMessage => ({
  id: 's1',
  contact: '5511999887766',
  message: 'Oi',
  scheduledDate: new Date('2026-08-19T12:00:00'),
  status: 'pending',
  createdAt: new Date('2026-08-19T10:00:00'),
  ...overrides,
});

const conversation = { id: '5511999887766:n1', contactPhone: '5511999887766' };

describe('schedulesForConversation', () => {
  it('inclui o item com o conversationId da thread', () => {
    const list = schedulesForConversation(
      [row({ conversationId: '5511999887766:n1' }), row({ id: 's2', conversationId: '5511999887766:n2' })],
      conversation
    );
    expect(list.map((item) => item.id)).toEqual(['s1']);
  });

  it('inclui o item sem conversationId do mesmo telefone', () => {
    const list = schedulesForConversation(
      [row(), row({ id: 's2', contact: '5511888777666' })],
      conversation
    );
    expect(list.map((item) => item.id)).toEqual(['s1']);
  });
});
