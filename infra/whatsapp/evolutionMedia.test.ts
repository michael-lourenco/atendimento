import { Message } from '../../core/entities/Message';
import { MockMediaStorage } from '../mocks/MockMediaStorage';
import { messageMediaPath } from '../../core/services/IMediaStorage';
import {
  hydrateEvolutionMedia,
  parseEvolutionMediaResponse,
  resolvePlayableMedia,
} from './evolutionMedia';

function audioMessage(): Message {
  return {
    id: 'aud1',
    from: '5521982790723',
    to: 'default',
    content: 'Áudio recebido',
    type: 'audio',
    timestamp: new Date('2024-01-15T10:00:00'),
    direction: 'incoming',
    status: 'delivered',
  };
}

describe('parseEvolutionMediaResponse', () => {
  it('lê base64 e mimetype', () => {
    const parsed = parseEvolutionMediaResponse({
      base64: 'A'.repeat(24),
      mimetype: 'audio/ogg; codecs=opus',
    });
    expect(parsed?.mimeType).toBe('audio/ogg');
    expect(parsed?.bytes.length).toBeGreaterThan(0);
  });

  it('ignora payload sem arquivo', () => {
    expect(parseEvolutionMediaResponse({ mimetype: 'audio/ogg' })).toBeNull();
  });
});

describe('hydrateEvolutionMedia', () => {
  it('grava áudio no storage a partir do webhook', async () => {
    const storage = new MockMediaStorage();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    await hydrateEvolutionMedia({
      payload: {
        event: 'messages.upsert',
        data: {
          key: { id: 'aud1', remoteJid: '5521982790723@s.whatsapp.net', fromMe: false },
          message: { audioMessage: { mimetype: 'audio/ogg' } },
        },
      },
      messages: [audioMessage()],
      download: async () => ({ bytes, mimeType: 'audio/ogg' }),
      storage,
    });
    const saved = await storage.get(messageMediaPath('aud1'));
    expect(saved?.mimeType).toBe('audio/ogg');
    expect(Array.from(saved?.bytes ?? [])).toEqual([1, 2, 3, 4]);
  });
});

describe('resolvePlayableMedia', () => {
  it('usa cache e não baixa de novo', async () => {
    const storage = new MockMediaStorage();
    await storage.save(messageMediaPath('aud1'), {
      bytes: new Uint8Array([9]),
      mimeType: 'audio/ogg',
    });
    let downloads = 0;
    const file = await resolvePlayableMedia({
      message: audioMessage(),
      storage,
      download: async () => {
        downloads += 1;
        return { bytes: new Uint8Array([1]), mimeType: 'audio/ogg' };
      },
    });
    expect(downloads).toBe(0);
    expect(file?.bytes[0]).toBe(9);
  });
});
