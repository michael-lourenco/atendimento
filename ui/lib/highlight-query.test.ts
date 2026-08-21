import { highlightQueryMatches } from './highlight-query';

describe('highlightQueryMatches', () => {
  it('sem termo devolve o texto inteiro', () => {
    expect(highlightQueryMatches('Olá', '  ')).toEqual([{ text: 'Olá', match: false }]);
  });

  it('marca o trecho ignorando maiúsculas', () => {
    expect(highlightQueryMatches('Quero uma demo hoje', 'DEMO')).toEqual([
      { text: 'Quero uma ', match: false },
      { text: 'demo', match: true },
      { text: ' hoje', match: false },
    ]);
  });
});
