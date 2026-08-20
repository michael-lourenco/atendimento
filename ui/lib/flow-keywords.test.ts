import {
  addFlowKeywords,
  normalizeFlowKeywords,
  popFlowKeyword,
  removeFlowKeyword,
  tokenizeKeywordDraft,
} from './flow-keywords';

describe('tokenizeKeywordDraft', () => {
  it('parte por vírgula, ponto e vírgula e quebra de linha', () => {
    expect(tokenizeKeywordDraft('preço, humano\nfaq; ajuda')).toEqual([
      'preço',
      'humano',
      'faq',
      'ajuda',
    ]);
  });

  it('ignora vazio', () => {
    expect(tokenizeKeywordDraft('  , \n ; ')).toEqual([]);
  });
});

describe('addFlowKeywords', () => {
  it('trim e ignora duplicata sem olhar maiúsculas', () => {
    expect(addFlowKeywords(['Preço'], ' preço , humano , PREÇO ')).toEqual(['Preço', 'humano']);
  });

  it('não muda se o rascunho for vazio', () => {
    const current = ['preço'];
    expect(addFlowKeywords(current, '   ')).toBe(current);
  });

  it('duplicata só não cria lista nova', () => {
    const current = ['preço'];
    expect(addFlowKeywords(current, 'PREÇO')).toBe(current);
  });
});

describe('normalizeFlowKeywords', () => {
  it('limpa lista vinda do banco', () => {
    expect(normalizeFlowKeywords(['  preço  ', 'Preço', '', 'humano'])).toEqual([
      'preço',
      'humano',
    ]);
  });
});

describe('removeFlowKeyword', () => {
  it('tira pelo índice', () => {
    expect(removeFlowKeyword(['preço', 'humano'], 0)).toEqual(['humano']);
  });

  it('índice inválido não altera', () => {
    expect(removeFlowKeyword(['preço'], 3)).toEqual(['preço']);
  });
});

describe('popFlowKeyword', () => {
  it('tira a última', () => {
    expect(popFlowKeyword(['preço', 'humano'])).toEqual(['preço']);
    expect(popFlowKeyword([])).toEqual([]);
  });
});
