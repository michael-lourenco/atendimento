import { quickReplyAudioFileError } from './quick-reply-audio';

describe('quickReplyAudioFileError', () => {
  it('aceita áudio pequeno', () => {
    const file = new File([new Uint8Array([1])], 'a.ogg', { type: 'audio/ogg' });
    expect(quickReplyAudioFileError(file)).toBeNull();
  });

  it('recusa tipo que não é áudio', () => {
    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    expect(quickReplyAudioFileError(file)).toBe('Só é permitido áudio');
  });
});
