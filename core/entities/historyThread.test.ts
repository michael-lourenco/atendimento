import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import {
  historyContactPhone,
  historyStatusLabel,
  historyThreadForMessage,
  historyTypeLabel,
} from './historyThread';

const comercial: WhatsAppNumber = {
  id: 'n1',
  name: 'Comercial',
  number: '5511000000001',
  status: 'active',
  provider: 'evolution',
  instanceName: 'comercial',
  createdAt: new Date('2026-08-19'),
};

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

describe('historyThreadForMessage', () => {
  it('acha a thread da linha da mensagem', () => {
    expect(historyThreadForMessage(incoming, [thread], [comercial])?.id).toBe('5511999:n1');
  });

  it('sem thread usa o telefone do contato', () => {
    expect(historyContactPhone(incoming)).toBe('5511999');
    expect(historyThreadForMessage(incoming, [], [comercial])).toBeUndefined();
  });
});

describe('historyStatusLabel', () => {
  it('entrada é Recebida; saída usa tique em português', () => {
    expect(historyStatusLabel(incoming)).toBe('Recebida');
    expect(historyStatusLabel({ ...incoming, direction: 'outgoing', status: 'read' })).toBe('Lida');
    expect(historyStatusLabel({ ...incoming, direction: 'outgoing', status: 'failed' })).toBe(
      'Falhou'
    );
  });

  it('tipo em português', () => {
    expect(historyTypeLabel('text')).toBe('Texto');
    expect(historyTypeLabel('image')).toBe('Imagem');
  });
});
