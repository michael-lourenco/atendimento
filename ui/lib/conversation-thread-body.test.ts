import { conversationThreadBody } from './conversation-thread-body';

describe('conversationThreadBody', () => {
  it('mostra carregando até a busca terminar', () => {
    expect(
      conversationThreadBody({ ready: false, messageCount: 0, hasPending: false })
    ).toBe('loading');
    expect(
      conversationThreadBody({ ready: false, messageCount: 3, hasPending: false })
    ).toBe('loading');
  });

  it('mostra vazio só depois da busca sem mensagens', () => {
    expect(
      conversationThreadBody({ ready: true, messageCount: 0, hasPending: false })
    ).toBe('empty');
  });

  it('mostra as mensagens quando a busca trouxe itens ou envio pendente', () => {
    expect(
      conversationThreadBody({ ready: true, messageCount: 2, hasPending: false })
    ).toBe('messages');
    expect(
      conversationThreadBody({ ready: true, messageCount: 0, hasPending: true })
    ).toBe('messages');
  });
});
