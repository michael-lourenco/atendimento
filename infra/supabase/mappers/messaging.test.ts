import { Conversation } from '../../../core/entities/Conversation';
import { conversationToRow } from './messaging';

const base: Conversation = {
  id: '5515996507651',
  contactId: '5515996507651',
  contactName: 'Ana',
  contactPhone: '5515996507651',
  status: 'open',
  unreadCount: 1,
  lastActivity: new Date('2026-08-19T12:00:00Z'),
  createdAt: new Date('2026-08-19T12:00:00Z'),
  tags: [],
};

describe('conversationToRow', () => {
  it('não manda last_message sem snapshot (evita 400 se a coluna não existir)', () => {
    expect(conversationToRow(base)).not.toHaveProperty('last_message');
  });

  it('manda last_message quando há prévia', () => {
    const row = conversationToRow({
      ...base,
      lastMessage: {
        id: 'm1',
        from: '5515996507651',
        to: 'comercial',
        content: 'oi',
        type: 'text',
        timestamp: new Date('2026-08-19T12:00:00Z'),
        direction: 'incoming',
        status: 'delivered',
      },
    });
    expect(row.last_message).toMatchObject({ content: 'oi', from_address: '5515996507651' });
  });
});
