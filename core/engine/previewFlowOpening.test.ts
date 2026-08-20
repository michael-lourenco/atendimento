import { previewFlowOpening, previewFlowTurn } from './previewFlowOpening';

const greetingAndMenu = [
  { id: 'w', type: 'message' as const, content: 'Olá', nextStepId: 'q' },
  {
    id: 'q',
    type: 'question' as const,
    content: 'Como posso ajudar?',
    options: ['Vendas', 'Suporte'],
  },
];

describe('previewFlowOpening', () => {
  it('mostra boas-vindas e a pergunta com opções', () => {
    const replies = previewFlowOpening(greetingAndMenu);
    expect(replies.map((item) => item.content)).toEqual([
      'Olá',
      'Como posso ajudar?\n1. Vendas\n2. Suporte',
    ]);
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
    expect(replies.map((item) => item.content)).toEqual(['Olá', 'Central de ajuda']);
  });

  it('inclui mídia do passo Mensagem', () => {
    const replies = previewFlowOpening([
      {
        id: 'w',
        type: 'message',
        content: 'Olá',
        mediaUrl: 'https://cdn.example/foto.jpg',
        mediaKind: 'image',
      },
    ]);
    expect(replies[0]).toMatchObject({
      content: 'Olá',
      mediaUrl: 'https://cdn.example/foto.jpg',
      mediaKind: 'image',
    });
  });

  it('conhecido começa na pergunta, sem Olá', () => {
    const replies = previewFlowOpening(greetingAndMenu, new Date(0), [], 'known');
    expect(replies.map((item) => item.content)).toEqual([
      'Como posso ajudar?\n1. Vendas\n2. Suporte',
    ]);
  });
});

describe('previewFlowTurn', () => {
  it('conhecido deixa a sessão na pergunta', () => {
    const plan = previewFlowTurn(greetingAndMenu, new Date(0), [], 'known');
    expect(plan.nextSession.currentStepId).toBe('q');
  });
});
