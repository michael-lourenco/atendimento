import { runExclusive } from './runExclusive';

describe('runExclusive', () => {
  it('serializa trabalho da mesma chave', async () => {
    const order: number[] = [];
    await Promise.all([
      runExclusive('a', async () => {
        await Promise.resolve();
        order.push(1);
      }),
      runExclusive('a', async () => {
        order.push(2);
      }),
    ]);
    expect(order).toEqual([1, 2]);
  });

  it('chaves diferentes não esperam uma pela outra', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const second = runExclusive('b', async () => 'b');
    const first = runExclusive('a', async () => {
      await gate;
      return 'a';
    });
    await expect(second).resolves.toBe('b');
    release();
    await expect(first).resolves.toBe('a');
  });
});
