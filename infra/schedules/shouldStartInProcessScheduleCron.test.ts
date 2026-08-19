import { shouldStartInProcessScheduleCron } from './shouldStartInProcessScheduleCron';

describe('shouldStartInProcessScheduleCron', () => {
  it('sobe em next dev/start', () => {
    expect(
      shouldStartInProcessScheduleCron({ NODE_ENV: 'development' })
    ).toBe(true);
    expect(shouldStartInProcessScheduleCron({ NODE_ENV: 'production' })).toBe(true);
  });

  it('não sobe em test, build ou Vercel', () => {
    expect(shouldStartInProcessScheduleCron({ NODE_ENV: 'test' })).toBe(false);
    expect(
      shouldStartInProcessScheduleCron({ NEXT_PHASE: 'phase-production-build' })
    ).toBe(false);
    expect(shouldStartInProcessScheduleCron({ VERCEL: '1' })).toBe(false);
    expect(shouldStartInProcessScheduleCron({ NEXT_RUNTIME: 'edge' })).toBe(false);
  });
});
