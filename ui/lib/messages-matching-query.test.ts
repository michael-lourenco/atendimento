import { messagesMatchingQuery } from './messages-matching-query';
import { Message } from '@/core/entities/Message';

const now = new Date('2026-08-19T12:00:00Z');

function msg(id: string, content: string): Message {
  return {
    id,
    from: '1',
    to: '2',
    content,
    type: 'text',
    timestamp: now,
    direction: 'incoming',
    status: 'delivered',
  };
}

describe('messagesMatchingQuery', () => {
  const list = [msg('1', 'Quero uma demo'), msg('2', 'Já sou cliente')];

  it('sem texto devolve tudo', () => {
    expect(messagesMatchingQuery(list, '  ')).toEqual(list);
  });

  it('filtra pelo conteúdo', () => {
    expect(messagesMatchingQuery(list, 'DEMO').map((item) => item.id)).toEqual(['1']);
  });
});
