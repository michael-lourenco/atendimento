import { matchesTagFilter, uniqueTagNames } from './tagFilter';

describe('matchesTagFilter', () => {
  it('all passa qualquer lista', () => {
    expect(matchesTagFilter([], 'all')).toBe(true);
    expect(matchesTagFilter(['VIP'], 'all')).toBe(true);
  });

  it('casa o nome sem ligar maiúsculas', () => {
    expect(matchesTagFilter(['VIP', 'Lead'], 'vip')).toBe(true);
    expect(matchesTagFilter(['Lead'], 'VIP')).toBe(false);
  });
});

describe('uniqueTagNames', () => {
  it('ordena e tira vazio/duplicata', () => {
    expect(uniqueTagNames([{ tags: ['VIP', ''] }, { tags: ['Lead', 'vip'] }])).toEqual([
      'Lead',
      'VIP',
    ]);
  });
});
