import { Conversation } from './Conversation';
import { WhatsAppNumber } from './WhatsAppNumber';
import { scheduleOutgoingLineName } from './scheduleOutgoingLine';

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

const thread = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: '5511999:n1',
  contactId: '5511999',
  contactName: 'Ana',
  contactPhone: '5511999',
  whatsappNumberId: 'n1',
  status: 'open',
  unreadCount: 0,
  lastActivity: new Date('2026-08-18'),
  createdAt: new Date('2026-08-18'),
  tags: [],
  ...overrides,
});

describe('scheduleOutgoingLineName', () => {
  it('usa a thread do conversationId', () => {
    const conversations = [
      thread(),
      thread({
        id: '5511999:n2',
        whatsappNumberId: 'n2',
        lastActivity: new Date('2026-08-20'),
      }),
    ];
    expect(
      scheduleOutgoingLineName(
        { contact: '5511999', conversationId: '5511999:n1' },
        conversations,
        [comercial, suporte]
      )
    ).toBe('Comercial');
  });

  it('sem conversationId usa a conversa mais recente do telefone', () => {
    const conversations = [
      thread(),
      thread({
        id: '5511999:n2',
        whatsappNumberId: 'n2',
        lastActivity: new Date('2026-08-20'),
      }),
    ];
    expect(
      scheduleOutgoingLineName({ contact: '5511999' }, conversations, [comercial, suporte])
    ).toBe('Suporte');
  });

  it('sem conversa mostra traço', () => {
    expect(scheduleOutgoingLineName({ contact: '5511999' }, [], [comercial])).toBe('—');
  });
});
