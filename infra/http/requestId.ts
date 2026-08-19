export const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdFrom(request: Pick<Request, 'headers'>): string {
  const incoming = request.headers.get(REQUEST_ID_HEADER)?.trim() ?? '';
  if (incoming.length > 0 && incoming.length <= 128) {
    return incoming;
  }
  return crypto.randomUUID();
}
