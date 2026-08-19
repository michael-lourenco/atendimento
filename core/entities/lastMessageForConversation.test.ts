import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import {
  applyLastMessageStatus,
  attachMissingLastMessages,
  lastMessageForConversation,
} from './lastMessageForConversation';

const comercial: WhatsAppNumber = {
  id: 'n1',
  name: 'Comercial',
  number: '5511000000001',
  status: 'active',
  provider: 'evolution',
  instanceName: 'comercial',
  createdAt: new Date('2026-08-19'),
};

const suporte: WhatsAppNumber = {
  id: 'n2',
  name: 'Suporte',
  number: '5511000000002',
  status: 'active',
  provider: 'evolution',
  instanceName: 'suporte',
  createdAt: new Date('2026-08-19'),
};

const conversation: Conversation = {
  id: '5515996507651:n1',
  contactId: '5515996507651',
  contactName: 'Ana',
  contactPhone: '5515996507651',
  whatsappNumberId: 'n1',
  status: 'open',
  unreadCount: 0,
  lastActivity: new Date('2026-08-19T12:00:00Z'),
  createdAt: new Date('2026-08-19T10:00:00Z'),
  tags: [],
};

const msg = (overrides: Partial<Message>): Message => ({
  id: 'm1',
  from: '5515996507651',
  to: 'comercial',
  content: 'oi',
  type: 'text',
  timestamp: new Date('2026-08-19T11:00:00Z'),
  direction: 'incoming',
  status: 'delivered',
  ...overrides,
});

describe('lastMessageForConversation', () => {
  it('pega a mais recente da mesma linha', () => {
    const last = lastMessageForConversation(
      [
        msg({ id: 'old', content: 'ontem', timestamp: new Date('2026-08-18T11:00:00Z') }),
        msg({ id: 'new', content: 'hoje', timestamp: new Date('2026-08-19T12:00:00Z') }),
        msg({
          id: 'other-line',
          to: 'suporte',
          content: 'suporte',
          timestamp: new Date('2026-08-19T13:00:00Z'),
        }),
      ],
      conversation,
      comercial
    );
    expect(last?.content).toBe('hoje');
  });

  it('não mistura a linha de Suporte', () => {
    const last = lastMessageForConversation(
      [msg({ to: 'suporte', content: 'só suporte' })],
      conversation,
      comercial
    );
    expect(last).toBeUndefined();
  });
});

describe('attachMissingLastMessages', () => {
  it('preenche só quem ainda não tem lastMessage', () => {
    const already: Conversation = {
      ...conversation,
      id: 'other',
      lastMessage: msg({ id: 'kept', content: 'já tinha' }),
    };
    const [filled, untouched] = attachMissingLastMessages(
      [conversation, already],
      [msg({ content: 'nova' })],
      [comercial, suporte]
    );
    expect(filled.lastMessage?.content).toBe('nova');
    expect(untouched.lastMessage?.content).toBe('já tinha');
  });
});

describe('applyLastMessageStatus', () => {
  it('atualiza o status só se o id for o da prévia', () => {
    const current: Conversation = {
      ...conversation,
      lastMessage: msg({ id: 'm1', status: 'sent', direction: 'outgoing' }),
    };
    expect(applyLastMessageStatus(current, 'm1', 'read')?.lastMessage?.status).toBe('read');
    expect(applyLastMessageStatus(current, 'other', 'read')).toBeNull();
  });
});
