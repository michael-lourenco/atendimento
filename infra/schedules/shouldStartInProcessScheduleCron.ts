export const SCHEDULE_DISPATCH_INTERVAL_MS = 60_000;

export function shouldStartInProcessScheduleCron(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  if (env.NODE_ENV === 'test') {
    return false;
  }
  if (env.NEXT_PHASE === 'phase-production-build') {
    return false;
  }
  if (env.VERCEL === '1') {
    return false;
  }
  if (env.NEXT_RUNTIME === 'edge') {
    return false;
  }
  return true;
}
