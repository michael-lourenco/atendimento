import { shouldHandoffAfterMiss, shouldSkipConsumedIncoming, nextMissStreak } from './flowSessionTurn';

const now = new Date('2026-08-21T12:00:00Z');

describe('flowSessionTurn', () => {
  it('ignora incoming já consumido', () => {
    expect(
      shouldSkipConsumedIncoming(
        {
          contactId: '1',
          flowId: 'inicio',
          currentStepId: 'ask',
          paused: false,
          consumedIncomingAt: now,
          updatedAt: now,
        },
        now
      )
    ).toBe(true);
    expect(
      shouldSkipConsumedIncoming(
        {
          contactId: '1',
          flowId: 'inicio',
          currentStepId: 'ask',
          paused: false,
          consumedIncomingAt: now,
          updatedAt: now,
        },
        new Date(now.getTime() + 1)
      )
    ).toBe(false);
  });

  it('conta miss e decide handoff', () => {
    expect(nextMissStreak(true, false, 2)).toBe(3);
    expect(nextMissStreak(false, true, 2)).toBe(0);
    expect(shouldHandoffAfterMiss(3, 3)).toBe(true);
    expect(shouldHandoffAfterMiss(2, 3)).toBe(false);
    expect(shouldHandoffAfterMiss(9, 0)).toBe(false);
  });
});
