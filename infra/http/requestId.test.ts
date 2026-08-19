import { REQUEST_ID_HEADER, requestIdFrom } from './requestId';

describe('requestIdFrom', () => {
  it('ecoa x-request-id incoming se <= 128 chars', () => {
    const request = new Request('http://localhost/api/auth/me', {
      headers: { [REQUEST_ID_HEADER]: 'req-abc' },
    });
    expect(requestIdFrom(request)).toBe('req-abc');
  });

  it('gera UUID se incoming passar de 128 chars', () => {
    const request = new Request('http://localhost/api/auth/me', {
      headers: { [REQUEST_ID_HEADER]: 'x'.repeat(129) },
    });
    expect(requestIdFrom(request)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('gera UUID se o header estiver ausente', () => {
    const request = new Request('http://localhost/api/auth/me');
    expect(requestIdFrom(request)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
