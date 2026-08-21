import { previewFlowOpening, previewFlowTurn, simulateFlowIncoming } from './previewFlowOpening';

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

describe('simulateFlowIncoming', () => {
  const cliente = [
    { id: 'msg', type: 'message' as const, content: 'Vou te passar', nextStepId: 'h' },
    {
      id: 'h',
      type: 'action' as const,
      content: 'Um atendente já te chama',
      action: { type: 'handoff' as const, departmentId: '1' },
    },
  ];

  it('depois do handoff o bot não responde', () => {
    const afterHandoff = simulateFlowIncoming({
      steps: cliente,
      session: null,
      incomingText: 'oi',
    });
    expect(afterHandoff?.nextSession.paused).toBe(true);
    expect(afterHandoff?.replies.map((item) => item.content)).toEqual([
      'Vou te passar',
      'Um atendente já te chama',
    ]);

    const next = simulateFlowIncoming({
      steps: cliente,
      session: afterHandoff?.nextSession ?? null,
      incomingText: 'ainda estou aqui',
    });
    expect(next?.skipped).toBe(true);
    expect(next?.replies).toEqual([]);
    expect(next?.nextSession.paused).toBe(true);
  });

  it('depois do goToFlow a opção seguinte continua no destino', () => {
    const faq = {
      id: 'faq',
      name: 'FAQ',
      isActive: true,
      steps: [
        { id: 'faq_hi', type: 'message' as const, content: 'Ajuda rápida', nextStepId: 'faq_ask' },
        {
          id: 'faq_ask',
          type: 'question' as const,
          content: 'Qual dúvida?',
          options: ['Preço', 'Outro'],
          nextStepId: 'faq_ok',
        },
        { id: 'faq_ok', type: 'message' as const, content: 'Combinado' },
      ],
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    const inicioSteps = [
      { id: 'w', type: 'message' as const, content: 'Olá', nextStepId: 'j' },
      {
        id: 'j',
        type: 'action' as const,
        content: '',
        action: { type: 'goToFlow' as const, flowId: 'faq' },
      },
    ];

    const first = simulateFlowIncoming({
      steps: inicioSteps,
      catalog: [faq],
      flowId: 'inicio',
      session: null,
      incomingText: 'oi',
    });
    expect(first?.nextSession.flowId).toBe('faq');
    expect(first?.nextSession.currentStepId).toBe('faq_ask');

    const second = simulateFlowIncoming({
      steps: inicioSteps,
      catalog: [faq],
      flowId: 'inicio',
      session: first?.nextSession ?? null,
      incomingText: '1',
    });
    expect(second?.skipped).toBe(false);
    expect(second?.nextSession.flowId).toBe('faq');
    expect(second?.replies.map((item) => item.content)).toEqual(['Combinado']);
  });
});
