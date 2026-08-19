import { catalogLoadPhase } from './catalog-load-phase';

describe('catalogLoadPhase', () => {
  it('não trata lista vazia como empty enquanto carrega', () => {
    expect(catalogLoadPhase(true, 0)).toBe('loading');
    expect(catalogLoadPhase(false, 0)).toBe('empty');
    expect(catalogLoadPhase(false, 3)).toBe('ready');
  });
});
