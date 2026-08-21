import { isActiveComposerPresence } from './composer-presence';

describe('isActiveComposerPresence', () => {
  it('paused só depois de composing ou recording', () => {
    expect(isActiveComposerPresence('composing')).toBe(true);
    expect(isActiveComposerPresence('recording')).toBe(true);
    expect(isActiveComposerPresence('paused')).toBe(false);
    expect(isActiveComposerPresence('')).toBe(false);
  });
});
