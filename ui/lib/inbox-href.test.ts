import {
  inboxHrefForContactPhone,
  inboxHrefForContactThreads,
  inboxHrefForConversation,
} from './inbox-href';

describe('inboxHrefForContactPhone', () => {
  it('abre a inbox com o telefone do contato', () => {
    expect(inboxHrefForContactPhone('55 11 99999-8888')).toBe(
      '/dashboard/conversations?contact=55%2011%2099999-8888'
    );
  });
});

describe('inboxHrefForContactThreads', () => {
  it('uma thread abre pelo id da conversa', () => {
    expect(inboxHrefForContactThreads('5511999', [{ id: '5511999:n1' }])).toBe(
      inboxHrefForConversation('5511999:n1')
    );
  });

  it('nenhuma thread cai no telefone', () => {
    expect(inboxHrefForContactThreads('5511999', [])).toBe(inboxHrefForContactPhone('5511999'));
  });

  it('várias threads deixam o menu escolher o id', () => {
    expect(
      inboxHrefForContactThreads('5511999', [{ id: '5511999:n1' }, { id: '5511999:n2' }])
    ).toBe(inboxHrefForContactPhone('5511999'));
  });
});
