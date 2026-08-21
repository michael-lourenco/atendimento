import { catalogMatchesQuery } from './catalog-filter';

describe('catalogMatchesQuery', () => {
  it('vazio casa tudo', () => {
    expect(catalogMatchesQuery('Comercial', '')).toBe(true);
  });

  it('casa o nome', () => {
    expect(catalogMatchesQuery('Comercial', 'merc')).toBe(true);
    expect(catalogMatchesQuery('Suporte', 'merc')).toBe(false);
  });
});
