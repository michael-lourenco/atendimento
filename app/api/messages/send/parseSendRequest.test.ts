import { MAX_OUTGOING_MEDIA_BYTES } from '@/core/services/IMediaStorage';
import { parseSendRequest, SendRequestError, assertOutgoingMediaSize } from './parseSendRequest';

describe('parseSendRequest', () => {
  it('lê JSON de texto', async () => {
    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '5521982790723', message: 'oi' }),
    });
    const parsed = await parseSendRequest(request);
    expect(parsed.to).toBe('5521982790723');
    expect(parsed.message).toBe('oi');
    expect(parsed.media).toBeUndefined();
  });

  it('lê conversationId no JSON', async () => {
    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: '5521982790723',
        message: 'oi',
        conversationId: '5521982790723:n1',
      }),
    });
    const parsed = await parseSendRequest(request);
    expect(parsed.conversationId).toBe('5521982790723:n1');
  });

  it('rejeita JSON sem mensagem', async () => {
    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '5521982790723', message: '  ' }),
    });
    await expect(parseSendRequest(request)).rejects.toBeInstanceOf(SendRequestError);
  });

  it('lê multipart com arquivo', async () => {
    const form = new FormData();
    form.append('to', '5521982790723');
    form.append('message', 'veja');
    form.append('file', new File([new Uint8Array([1, 2])], 'foto.jpg', { type: 'image/jpeg' }));
    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: form,
    });
    const parsed = await parseSendRequest(request);
    expect(parsed.media?.fileName).toBe('foto.jpg');
    expect(parsed.media?.mimeType).toBe('image/jpeg');
    expect(parsed.media?.bytes.length).toBe(2);
  });

  it('rejeita JSON inválido', async () => {
    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    await expect(parseSendRequest(request)).rejects.toMatchObject({
      message: 'JSON inválido',
      status: 400,
    });
  });

  it('rejeita arquivo maior que 16 MB', () => {
    expect(() => assertOutgoingMediaSize(MAX_OUTGOING_MEDIA_BYTES + 1)).toThrow(
      'Arquivo maior que 16 MB'
    );
  });
});
