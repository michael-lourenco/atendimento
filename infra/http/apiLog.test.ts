import { formatApiErrorLog, sanitizeLogDetail } from './apiLog';

describe('apiLog', () => {
  it('formata [requestId] mensagem: detalhe', () => {
    expect(formatApiErrorLog('abc', 'falhou', new Error('timeout'))).toBe('[abc] falhou: timeout');
  });

  it('sem detalhe quando não há erro', () => {
    expect(formatApiErrorLog('cron', 'Agendamentos falhou')).toBe('[cron] Agendamentos falhou');
  });

  it('não inclui token, apikey, service_role, JWT, Authorization nem base64', () => {
    const leaked = [
      'Authorization: Bearer secret-token',
      'apikey=local-evolution-key',
      'password=hunter2',
      'Cookie: sb-access-token=aaaa',
      'service_role eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
      'data:image/png;base64,iVBORw0KGgo=',
    ].join(' ');
    const detail = sanitizeLogDetail(leaked);
    expect(detail).not.toMatch(/secret-token/i);
    expect(detail).not.toMatch(/local-evolution-key/i);
    expect(detail).not.toMatch(/hunter2/);
    expect(detail).not.toMatch(/sb-access-token/i);
    expect(detail).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/);
    expect(detail).not.toMatch(/iVBORw0KGgo/);
    expect(detail).toContain('[redacted]');
  });

  it('não serializa error.response.data completo', () => {
    const axiosLike = {
      response: { data: { token: 'super-secret', qr: 'AAAA' } },
    };
    expect(sanitizeLogDetail(axiosLike)).toBe('unknown');
    expect(formatApiErrorLog('id', 'erro', axiosLike)).not.toContain('super-secret');
  });
});
