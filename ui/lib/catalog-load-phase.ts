export type CatalogLoadPhase = 'loading' | 'empty' | 'ready';

export function catalogLoadPhase(loading: boolean, count: number): CatalogLoadPhase {
  if (loading) {
    return 'loading';
  }
  return count === 0 ? 'empty' : 'ready';
}
