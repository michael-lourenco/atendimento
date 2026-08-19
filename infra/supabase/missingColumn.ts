export function isMissingColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message).toLowerCase() : '';
  const needle = column.toLowerCase();
  if (!message.includes(needle)) {
    return false;
  }
  return code === 'PGRST204' || code === '42703' || message.includes('schema cache') || message.includes('column');
}
