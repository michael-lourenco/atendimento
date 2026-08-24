import { FlowSession } from './FlowSession';

export function shouldSkipConsumedIncoming(
  session: FlowSession | null,
  incomingAt?: Date
): boolean {
  if (!session?.consumedIncomingAt || !incomingAt) {
    return false;
  }
  return incomingAt.getTime() <= new Date(session.consumedIncomingAt).getTime();
}

export function nextMissStreak(unmatchedQuestion: boolean, matched: boolean, current = 0): number {
  if (matched) {
    return 0;
  }
  if (unmatchedQuestion) {
    return current + 1;
  }
  return current;
}

export function shouldHandoffAfterMiss(streak: number, after: number): boolean {
  return after > 0 && streak >= after;
}
