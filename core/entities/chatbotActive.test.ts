import {
  companyChatbot,
  companyChatbotFlowId,
  extraChatbots,
  othersToDeactivate,
  resolveEntryFlowId,
  whatsappEntryFlowIds,
} from './chatbotActive';

describe('companyChatbot', () => {
  it('escolhe o ativo; senão o primeiro', () => {
    expect(companyChatbot([])).toBeNull();
    expect(
      companyChatbot([
        { id: 'a', isActive: false },
        { id: 'b', isActive: true },
      ])?.id
    ).toBe('b');
    expect(companyChatbot([{ id: 'a', isActive: false }])?.id).toBe('a');
  });
});

describe('companyChatbotFlowId', () => {
  it('lê o flowId do cadastro ativo', () => {
    expect(companyChatbotFlowId(undefined)).toBeUndefined();
    expect(
      companyChatbotFlowId([
        { isActive: false, flowId: 'inicio' },
        { isActive: true, flowId: 'faq' },
      ])
    ).toBe('faq');
  });
});

describe('resolveEntryFlowId', () => {
  it('prefere o fluxo da linha', () => {
    expect(
      resolveEntryFlowId({
        bots: [{ isActive: true, flowId: 'inicio' }],
        lineFlowId: 'faq',
      })
    ).toBe('faq');
  });

  it('cai no da empresa sem override', () => {
    expect(
      resolveEntryFlowId({
        bots: [{ isActive: true, flowId: 'inicio' }],
        lineFlowId: '  ',
      })
    ).toBe('inicio');
  });
});

describe('whatsappEntryFlowIds', () => {
  it('inclui empresa herdada e overrides das linhas', () => {
    expect(
      whatsappEntryFlowIds(
        [{ isActive: true, flowId: 'inicio' }],
        [{ flowId: 'faq' }, {}],
        'inicio'
      ).sort()
    ).toEqual(['faq', 'inicio']);
  });
});

describe('extraChatbots', () => {
  it('omite o cadastro da empresa', () => {
    const bots = [
      { id: 'main', isActive: true },
      { id: 'old', isActive: false },
    ];
    expect(extraChatbots(bots).map((item) => item.id)).toEqual(['old']);
  });
});

describe('othersToDeactivate', () => {
  it('lista os outros ativos ao gravar um ativo', () => {
    const catalog = [
      { id: 'a', isActive: true },
      { id: 'b', isActive: true },
      { id: 'c', isActive: false },
    ];
    expect(othersToDeactivate(catalog, { id: 'b', isActive: true }).map((item) => item.id)).toEqual([
      'a',
    ]);
    expect(othersToDeactivate(catalog, { id: 'b', isActive: false })).toEqual([]);
  });
});
