import { pttHoldShouldCancel } from './ptt-slide-cancel';

describe('pttHoldShouldCancel', () => {
  it('cancela ao deslizar para cima além do limiar', () => {
    expect(pttHoldShouldCancel(200, 120)).toBe(true);
    expect(pttHoldShouldCancel(200, 180)).toBe(false);
    expect(pttHoldShouldCancel(200, 220)).toBe(false);
  });
});
