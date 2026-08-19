import { previewFlowOpening } from './previewFlowOpening';

describe('previewFlowOpening', () => {
  it('mostra boas-vindas e a pergunta com opções', () => {
    const replies = previewFlowOpening([
      { id: 'w', type: 'message', content: 'Olá', nextStepId: 'q' },
      {
        id: 'q',
        type: 'question',
        content: 'Como posso ajudar?',
        options: ['Vendas', 'Suporte'],
      },
    ]);
    expect(replies).toEqual(['Olá', 'Como posso ajudar?\n- Vendas\n- Suporte']);
  });

  it('sem passos não gera bolha', () => {
    expect(previewFlowOpening([])).toEqual([]);
  });
});
