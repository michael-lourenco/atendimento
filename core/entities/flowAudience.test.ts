import {
  incomingFlowHints,
  resolveFlowAudience,
} from './flowAudience';
import { Conversation } from './Conversation';
import { Message } from './Message';

const now = new Date('2026-08-20T15:00:00Z');

function incoming(id: string, from = '5511999999999'): Message {
  return {
    id,
    from,
    to: 'comercial',
    content: 'oi',
    type: 'text',
    timestamp: now,
    direction: 'incoming',
    status: 'sent',
  };
}

const thread: Conversation = {
  id: '5511999999999:n-com',
  contactId: '5511999999999',
  contactName: 'Cliente',
  contactPhone: '5511999999999',
  status: 'open',
  unreadCount: 0,
  lastActivity: now,
  createdAt: now,
  tags: [],
  whatsappNumberId: 'n-com',
};

const line = {
  id: 'n-com',
  name: 'Comercial',
  number: '5511000000001',
  status: 'active' as const,
  provider: 'evolution',
  instanceName: 'comercial',
  createdAt: now,
};

describe('resolveFlowAudience', () => {
  it('conhecido exige thread e contato prévios', () => {
    expect(resolveFlowAudience({ threadExisted: true, contactExisted: true })).toBe('known');
  });

  it('cadastro sem thread nesta linha é novo', () => {
    expect(resolveFlowAudience({ threadExisted: false, contactExisted: true })).toBe('new');
  });

  it('thread sem contato no catálogo é novo', () => {
    expect(resolveFlowAudience({ threadExisted: true, contactExisted: false })).toBe('new');
  });
});

describe('incomingFlowHints', () => {
  it('lote do primeiro contato fica novo nas duas mensagens', () => {
    const hints = incomingFlowHints({
      messages: [incoming('a'), incoming('b')],
      conversations: [],
      existingContactIds: new Set(),
      catalog: [line],
    });
    expect(hints).toEqual([
      { sessionKey: '5511999999999:n-com', audience: 'new', reopened: false },
      { sessionKey: '5511999999999:n-com', audience: 'new', reopened: false },
    ]);
  });

  it('thread existente e contato salvo é conhecido', () => {
    const hints = incomingFlowHints({
      messages: [incoming('a')],
      conversations: [thread],
      existingContactIds: new Set(['5511999999999']),
      catalog: [line],
    });
    expect(hints[0]).toMatchObject({ audience: 'known', reopened: false });
  });

  it('conversa closed marca reabertura', () => {
    const hints = incomingFlowHints({
      messages: [incoming('a')],
      conversations: [{ ...thread, status: 'closed' }],
      existingContactIds: new Set(['5511999999999']),
      catalog: [line],
    });
    expect(hints[0]).toMatchObject({ audience: 'known', reopened: true });
  });
});
