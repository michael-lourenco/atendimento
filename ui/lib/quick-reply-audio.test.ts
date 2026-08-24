import { quickReplyMediaFileError } from './quick-reply-audio';

describe('quickReplyMediaFileError', () => {
  it('aceita áudio, imagem, vídeo e PDF pequenos', () => {
    expect(
      quickReplyMediaFileError(new File([new Uint8Array([1])], 'a.ogg', { type: 'audio/ogg' }))
    ).toBeNull();
    expect(
      quickReplyMediaFileError(new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
    ).toBeNull();
    expect(
      quickReplyMediaFileError(new File([new Uint8Array([1])], 'a.mp4', { type: 'video/mp4' }))
    ).toBeNull();
    expect(
      quickReplyMediaFileError(
        new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' })
      )
    ).toBeNull();
  });

  it('recusa documento que não é PDF', () => {
    const file = new File([new Uint8Array([1])], 'a.zip', { type: 'application/zip' });
    expect(quickReplyMediaFileError(file)).toBe('Só é permitido imagem, vídeo, áudio ou PDF');
  });
});
