import { insertEmojiAtCursor } from './emoji';

describe('insertEmojiAtCursor', () => {
  it('insere no cursor', () => {
    expect(insertEmojiAtCursor('oi', '👍', 2, 2)).toEqual({ text: 'oi👍', cursor: 4 });
  });

  it('substitui a seleção', () => {
    expect(insertEmojiAtCursor('ola', '😊', 0, 3)).toEqual({ text: '😊', cursor: 2 });
  });

  it('insere no meio', () => {
    expect(insertEmojiAtCursor('ab', '🔥', 1, 1)).toEqual({ text: 'a🔥b', cursor: 3 });
  });

  it('insere o body de uma resposta rápida', () => {
    expect(insertEmojiAtCursor('', 'Olá! Como posso ajudar?', 0, 0)).toEqual({
      text: 'Olá! Como posso ajudar?',
      cursor: 'Olá! Como posso ajudar?'.length,
    });
  });
});
