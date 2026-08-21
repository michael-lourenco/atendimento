import { Conversation } from '@/core/entities/Conversation';
import { Message } from '@/core/entities/Message';
import { historyHrefForMessage } from './history-href';
import { inboxHrefForContactPhone, inboxHrefForConversation } from './inbox-href';

const thread: Conversation = {
  id: '5511999:n1',
  contactId: '5511999',
  contactName: 'Ana',
  contactPhone: '5511999',
  whatsappNumberId: 'n1',
  status: 'open',
  unreadCount: 0,
  lastActivity: new Date('2026-08-19T12:00:00Z'),
  createdAt: new Date('2026-08-19T12:00:00Z'),
  tags: [],
};

const incoming: Message = {
  id: 'm1',
  from: '5511999',
  to: 'comercial',
  content: 'oi',
  type: 'text',
  timestamp: new Date('2026-08-19T12:00:00Z'),
  direction: 'incoming',
  status: 'delivered',
};

describe('historyHrefForMessage', () => {
  it('abre a thread quando existe', () => {
    expect(historyHrefForMessage(incoming, [thread])).toBe(inboxHrefForConversation(thread.id));
  });

  it('sem thread cai no telefone', () => {
    expect(historyHrefForMessage(incoming, [])).toBe(inboxHrefForContactPhone('5511999'));
  });
});
