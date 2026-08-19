import { timingSafeEqual } from 'crypto';

export function hasCronBearer(
  authorizationHeader: string | null,
  secret = process.env.CRON_SECRET
): boolean {
  const expected = secret?.trim() ?? '';
  if (!expected) {
    return false;
  }
  const header = authorizationHeader?.trim() ?? '';
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    return false;
  }
  const token = header.slice(prefix.length).trim();
  return safeEqual(token, expected);
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
