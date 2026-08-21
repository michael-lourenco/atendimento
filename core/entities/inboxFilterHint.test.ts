import { Conversation } from './Conversation';
import { inboxHiddenCount, nextIncomingQueueConversation } from './inboxFilterHint';
import { Message } from './Message';

const row = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: '1',
  contactId: '1',
  contactName: 'Ana',
  contactPhone: '5511',
  status: 'open',
  unreadCount: 0,
  lastActivity: new Date('2026-08-19'),
  createdAt: new Date('2026-08-19'),
  tags: [],
  ...overrides,
});

describe('inboxHiddenCount', () => {
  const list = [
    row({ id: 'a', contactPhone: '1', status: 'open' }),
    row({
      id: 'b',
      contactPhone: '2',
      status: 'waiting',
      assignedAgentId: 'me',
      departmentId: '1',
    }),
    row({
      id: 'c',
      contactPhone: '3',
      status: 'waiting',
      assignedAgentId: 'other',
      departmentId: '2',
    }),
  ];

  it('conta o que a aba tem e o filtro esconde', () => {
    expect(inboxHiddenCount(list, 'incoming', true, 'me', 'all', '')).toBe(0);
    expect(inboxHiddenCount(list, 'waiting', true, 'me', 'all', '')).toBe(1);
    expect(inboxHiddenCount(list, 'waiting', false, 'me', 'all', '')).toBe(0);
    expect(inboxHiddenCount(list, 'waiting', false, 'me', '1', '')).toBe(1);
  });

  it('esconde conversas de outras linhas', () => {
    const withLines = [
      row({ id: 'a', contactPhone: '1', status: 'open', whatsappNumberId: 'n1' }),
      row({ id: 'b', contactPhone: '2', status: 'open', whatsappNumberId: 'n2' }),
    ];
    expect(inboxHiddenCount(withLines, 'incoming', false, 'me', 'all', '', 'n1')).toBe(1);
    expect(inboxHiddenCount(withLines, 'incoming', false, 'me', 'all', '', 'all')).toBe(0);
  });

  it('busca também o texto da thread', () => {
    const withPreview = [
      row({
        id: 'a',
        contactPhone: '1',
        status: 'open',
        lastMessage: {
          id: 'm1',
          from: '1',
          to: 'linha',
          content: 'Quero fechar contrato',
          type: 'text',
          timestamp: new Date('2026-08-19'),
          direction: 'incoming',
          status: 'delivered',
        } satisfies Message,
      }),
      row({ id: 'b', contactPhone: '2', contactName: 'Bruno', status: 'open' }),
    ];
    expect(inboxHiddenCount(withPreview, 'incoming', false, 'me', 'all', 'contrato')).toBe(1);
    expect(inboxHiddenCount(withPreview, 'incoming', false, 'me', 'all', 'bruno')).toBe(1);
  });

  it('esconde conversas de outras etiquetas', () => {
    const withTags = [
      row({ id: 'a', contactPhone: '1', status: 'open', tags: ['VIP'] }),
      row({ id: 'b', contactPhone: '2', status: 'open', tags: ['Lead'] }),
    ];
    expect(inboxHiddenCount(withTags, 'incoming', false, 'me', 'all', '', 'all', undefined, 'VIP')).toBe(
      1
    );
    expect(inboxHiddenCount(withTags, 'incoming', false, 'me', 'all', '', 'all', undefined, 'all')).toBe(
      0
    );
  });
});

describe('nextIncomingQueueConversation', () => {
  const incoming = (id: string, overrides: Partial<Conversation> = {}): Conversation =>
    row({ id, contactPhone: id, status: 'open', ...overrides });

  it('abre a próxima da Entrada na ordem da lista', () => {
    const list = [incoming('a'), incoming('b'), incoming('c')];
    expect(nextIncomingQueueConversation(list, 'a', false, 'me', 'all')?.id).toBe('b');
    expect(nextIncomingQueueConversation(list, 'b', false, 'me', 'all')?.id).toBe('c');
  });

  it('na última volta para a que ficou no lugar', () => {
    const list = [incoming('a'), incoming('b'), incoming('c')];
    expect(nextIncomingQueueConversation(list, 'c', false, 'me', 'all')?.id).toBe('b');
  });

  it('sem outras na Entrada devolve indefinido', () => {
    expect(nextIncomingQueueConversation([incoming('a')], 'a', false, 'me', 'all')).toBeUndefined();
  });

  it('ao finalizar uma conversa assumida pega a Entrada', () => {
    const list = [
      incoming('a'),
      row({
        id: 'mine',
        contactPhone: '9',
        status: 'open',
        assignedAgentId: 'me',
      }),
    ];
    expect(nextIncomingQueueConversation(list, 'mine', true, 'me', 'all')?.id).toBe('a');
  });

  it('respeita setor e linha e ignora busca', () => {
    const list = [
      incoming('a', { departmentId: '1', whatsappNumberId: 'n1' }),
      incoming('b', { departmentId: '2', whatsappNumberId: 'n1' }),
      incoming('c', { departmentId: '1', whatsappNumberId: 'n1' }),
    ];
    expect(nextIncomingQueueConversation(list, 'a', false, 'me', '1', 'n1')?.id).toBe('c');
  });
});
