const REDACTED = '[redacted]';

const SECRET_PATTERN =
  /bearer\s+\S+|authorization\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+|apikey\s*[:=]\s*\S+|password\s*[:=]\s*\S+|cookie\s*[:=]\s*\S+|cron[_-]?secret\s*[:=]\s*\S+|service_role|eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi;

function sanitizeString(text: string): string {
  let out = text.replace(/data:[^;]+;base64,[a-zA-Z0-9+/=]+/gi, REDACTED);
  out = out.replace(SECRET_PATTERN, REDACTED);
  if (out.length > 400) {
    return `${out.slice(0, 400)}…`;
  }
  return out;
}

export function sanitizeLogDetail(error: unknown): string {
  if (error instanceof Error) {
    return sanitizeString(error.message);
  }
  if (typeof error === 'string') {
    return sanitizeString(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return sanitizeString(message);
    }
  }
  return 'unknown';
}

export function formatApiErrorLog(requestId: string, message: string, error?: unknown): string {
  if (error === undefined) {
    return `[${requestId}] ${message}`;
  }
  return `[${requestId}] ${message}: ${sanitizeLogDetail(error)}`;
}

export function logApiError(requestId: string, message: string, error?: unknown): void {
  console.error(formatApiErrorLog(requestId, message, error));
}
