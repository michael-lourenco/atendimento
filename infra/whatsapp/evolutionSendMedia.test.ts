import { buildEvolutionMediaPost, evolutionSendEnvelope } from './evolutionSendMedia';
import { SendMessageParams } from '../../core/services/IWhatsAppService';

const imageParams: SendMessageParams = {
  to: '5521982790723',
  message: 'capa',
  media: {
    mimeType: 'image/jpeg',
    fileName: 'foto.jpg',
    bytes: new Uint8Array([1, 2, 3]),
  },
};

describe('buildEvolutionMediaPost', () => {
  it('usa sendMedia para imagem', () => {
    const post = buildEvolutionMediaPost('default', '5521982790723', imageParams);
    expect(post.path).toBe('/message/sendMedia/default');
    expect(post.body.mediatype).toBe('image');
    expect(post.body.caption).toBe('capa');
    expect(post.body.fileName).toBe('foto.jpg');
    expect(typeof post.body.media).toBe('string');
  });

  it('usa sendWhatsAppAudio para áudio', () => {
    const post = buildEvolutionMediaPost('default', '5521982790723', {
      to: '5521982790723',
      message: '',
      media: {
        mimeType: 'audio/ogg',
        fileName: 'voz.ogg',
        bytes: new Uint8Array([9, 8]),
      },
    });
    expect(post.path).toBe('/message/sendWhatsAppAudio/default');
    expect(post.body.audio).toBeDefined();
    expect(post.body.encoding).toBe(true);
  });
});

describe('evolutionSendEnvelope', () => {
  it('lê key.id da Evolution', () => {
    const envelope = evolutionSendEnvelope('5521982790723', { key: { id: 'ABC' } });
    expect(envelope.messages[0].id).toBe('ABC');
    expect(envelope.contacts[0].wa_id).toBe('5521982790723');
  });
});
