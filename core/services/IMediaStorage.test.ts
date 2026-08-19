import { assertNoOutgoingMedia } from './IWhatsAppService';
import { mediaKindFromMime } from './IMediaStorage';

describe('mediaKindFromMime', () => {
  it('classifica image/audio/video/document', () => {
    expect(mediaKindFromMime('image/png')).toBe('image');
    expect(mediaKindFromMime('audio/ogg; codecs=opus')).toBe('audio');
    expect(mediaKindFromMime('video/mp4')).toBe('video');
    expect(mediaKindFromMime('application/pdf')).toBe('document');
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
