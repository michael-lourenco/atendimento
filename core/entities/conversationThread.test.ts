import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import {
  conversationFromInboxQuery,
  conversationThreadId,
  findConversationThread,
  messageMatchesWhatsAppLine,
  threadsForContactPhone,
} from './conversationThread';

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

const row = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: '5511999',
  contactId: '5511999',
  contactName: 'Ana',
  contactPhone: '5511999',
  status: 'open',
  unreadCount: 0,
  lastActivity: new Date('2026-08-19T12:00:00Z'),
  createdAt: new Date('2026-08-19T12:00:00Z'),
  tags: [],
  ...overrides,
});

describe('conversationThreadId', () => {
  it('usa só o telefone sem linha', () => {
    expect(conversationThreadId('55 11 999', undefined)).toBe('5511999');
  });

  it('compõe telefone e linha', () => {
    expect(conversationThreadId('5511999', 'n1')).toBe('5511999:n1');
  });
});

describe('findConversationThread', () => {
  it('reusa legado id=telefone da mesma linha', () => {
    const legacy = row({ whatsappNumberId: 'n1' });
    expect(findConversationThread([legacy], '5511999', 'n1')?.id).toBe('5511999');
  });

  it('não mistura outra linha', () => {
    const comercialThread = row({ whatsappNumberId: 'n1' });
    expect(findConversationThread([comercialThread], '5511999', 'n2')).toBeUndefined();
  });

  it('acha o id composto', () => {
    const thread = row({ id: '5511999:n2', whatsappNumberId: 'n2' });
    expect(findConversationThread([thread], '5511999', 'n2')?.id).toBe('5511999:n2');
  });
});

describe('conversationFromInboxQuery', () => {
  it('abre pelo id da conversa', () => {
    const list = [
      row({ id: '5511999:n1', whatsappNumberId: 'n1' }),
      row({ id: '5511999:n2', whatsappNumberId: 'n2', lastActivity: new Date('2026-08-20') }),
    ];
    expect(
      conversationFromInboxQuery(list, { conversationId: '5511999:n1' })?.whatsappNumberId
    ).toBe('n1');
  });

  it('?contact= abre a mais recente', () => {
    const list = [
      row({ id: 'a', lastActivity: new Date('2026-08-18') }),
      row({ id: 'b', lastActivity: new Date('2026-08-20') }),
    ];
    expect(conversationFromInboxQuery(list, { contactPhone: '5511999' })?.id).toBe('b');
  });
});

describe('threadsForContactPhone', () => {
  it('lista as threads do telefone da mais recente para a mais antiga', () => {
    const list = [
      row({ id: '5511999:n1', whatsappNumberId: 'n1', lastActivity: new Date('2026-08-18') }),
      row({ id: '5511888:n1', contactPhone: '5511888', lastActivity: new Date('2026-08-21') }),
      row({ id: '5511999:n2', whatsappNumberId: 'n2', lastActivity: new Date('2026-08-20') }),
    ];
    expect(threadsForContactPhone(list, '55 11 999').map((item) => item.id)).toEqual([
      '5511999:n2',
      '5511999:n1',
    ]);
  });
});

describe('messageMatchesWhatsAppLine', () => {
  const incomingComercial: Message = {
    id: 'm1',
    from: '5511999',
    to: 'comercial',
    content: 'oi',
    type: 'text',
    timestamp: new Date(),
    direction: 'incoming',
    status: 'delivered',
  };

  it('separa Comercial de Suporte', () => {
    expect(messageMatchesWhatsAppLine(incomingComercial, comercial)).toBe(true);
    expect(messageMatchesWhatsAppLine(incomingComercial, suporte)).toBe(false);
  });
});
