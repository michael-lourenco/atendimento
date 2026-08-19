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
    expect(replies).toEqual(['Olá', 'Como posso ajudar?\n1. Vendas\n2. Suporte']);
  });

  it('sem passos não gera bolha', () => {
    expect(previewFlowOpening([])).toEqual([]);
  });

  it('segue o salto para outro fluxo na prévia', () => {
    const faq = {
      id: 'faq',
      name: 'FAQ',
      isActive: true,
      steps: [{ id: 'h', type: 'message' as const, content: 'Central de ajuda' }],
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    const replies = previewFlowOpening(
      [
        { id: 'w', type: 'message', content: 'Olá', nextStepId: 'j' },
        {
          id: 'j',
          type: 'action',
          content: '',
          action: { type: 'goToFlow', flowId: 'faq' },
        },
      ],
      new Date(0),
      [faq]
    );
    expect(replies).toEqual(['Olá', 'Central de ajuda']);
  });
});
