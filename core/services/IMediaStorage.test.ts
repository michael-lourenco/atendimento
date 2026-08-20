import { assertNoOutgoingMedia } from './IWhatsAppService';
import { contactAvatarApiHref, contactAvatarPath, mediaKindFromMime, quickReplyMediaApiHref, quickReplyMediaPath } from './IMediaStorage';

describe('mediaKindFromMime', () => {
  it('classifica image/audio/video/document', () => {
    expect(mediaKindFromMime('image/png')).toBe('image');
    expect(mediaKindFromMime('audio/ogg; codecs=opus')).toBe('audio');
    expect(mediaKindFromMime('video/mp4')).toBe('video');
    expect(mediaKindFromMime('application/pdf')).toBe('document');
  });
});

describe('contactAvatarPath', () => {
  it('href da foto no painel', () => {
    expect(contactAvatarPath('5511999')).toBe('contacts/5511999');
    expect(contactAvatarApiHref('5511999')).toBe('/api/contacts/5511999/avatar');
  });
});

describe('quickReplyMediaPath', () => {
  it('href do áudio no painel', () => {
    expect(quickReplyMediaPath('qr-1')).toBe('quick-replies/qr-1');
    expect(quickReplyMediaApiHref('qr-1')).toBe('/api/quick-replies/qr-1/media');
  });
});

describe('assertNoOutgoingMedia', () => {
  it('bloqueia mídia fora da Evolution', () => {
    expect(() =>
      assertNoOutgoingMedia({
        to: '1',
        message: '',
        media: { mimeType: 'image/jpeg', fileName: 'a.jpg', bytes: new Uint8Array([1]) },
      })
    ).toThrow(/Evolution/);
  });
});
