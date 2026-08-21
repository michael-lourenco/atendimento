import { Conversation } from '../../../core/entities/Conversation';
import { conversationToRow, messageToRow } from './messaging';

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

  it('não manda whatsapp_number_id sem linha (evita 400 se a coluna não existir)', () => {
    expect(conversationToRow(base)).not.toHaveProperty('whatsapp_number_id');
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

  it('manda viewer_at nulo sem viewer e preenche quando há', () => {
    expect(conversationToRow(base).viewer_at).toBeNull();
    expect(conversationToRow(base).viewer_agent_id).toBeNull();
    const row = conversationToRow({
      ...base,
      viewerAgentId: 'a1',
      viewerAgentName: 'João',
      viewerAt: new Date('2026-08-20T12:00:00Z'),
    });
    expect(row.viewer_agent_id).toBe('a1');
    expect(row.viewer_agent_name).toBe('João');
    expect(row.viewer_at).toBe('2026-08-20T12:00:00.000Z');
  });
});

describe('messageToRow', () => {
  it('grava reactions (vazio se ainda não houver)', () => {
    const base = {
      id: 'm1',
      from: '5511',
      to: 'bot',
      content: 'oi',
      type: 'text' as const,
      timestamp: new Date('2026-08-20T12:00:00Z'),
      direction: 'incoming' as const,
      status: 'delivered' as const,
    };
    expect(messageToRow(base).reactions).toEqual([]);
    expect(messageToRow({ ...base, reactions: [{ emoji: '👍', from: '5511' }] }).reactions).toEqual([
      { emoji: '👍', from: '5511' },
    ]);
  });

  it('só manda quoted_* quando há citação', () => {
    const base = {
      id: 'm1',
      from: '5511',
      to: 'bot',
      content: 'beleza',
      type: 'text' as const,
      timestamp: new Date('2026-08-20T12:00:00Z'),
      direction: 'incoming' as const,
      status: 'delivered' as const,
    };
    expect(messageToRow(base)).not.toHaveProperty('quoted_message_id');
    expect(messageToRow({ ...base, quotedMessageId: 'alvo', quotedContent: 'oi' }).quoted_message_id).toBe(
      'alvo'
    );
  });
});
