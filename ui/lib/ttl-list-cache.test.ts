import { createListCache } from './ttl-list-cache';

describe('createListCache', () => {
  it('reusa a mesma busca em voo e o TTL', async () => {
    let calls = 0;
    const cache = createListCache<string>(60_000);
    const fetchRows = async () => {
      calls += 1;
      return ['a'];
    };

    const [first, second] = await Promise.all([cache.list(fetchRows), cache.list(fetchRows)]);
    expect(first).toEqual(['a']);
    expect(second).toEqual(['a']);
    expect(calls).toBe(1);

    await cache.list(fetchRows);
    expect(calls).toBe(1);
  });

  it('invalidate força nova busca', async () => {
    let calls = 0;
    const cache = createListCache<string>(60_000);
    const fetchRows = async () => {
      calls += 1;
      return ['a'];
    };

    await cache.list(fetchRows);
    cache.invalidate();
    await cache.list(fetchRows);
    expect(calls).toBe(2);
  });
});
