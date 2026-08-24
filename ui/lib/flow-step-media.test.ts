import { flowStepMediaFileError, flowStepMediaPreviewSrc } from './flow-step-media';

describe('flowStepMediaPreviewSrc', () => {
  it('path do Storage vira GET autenticado', () => {
    expect(flowStepMediaPreviewSrc('inicio', 'welcome', 'flows/inicio/welcome')).toBe(
      '/api/flows/inicio/steps/welcome/media'
    );
  });

  it('URL http(s) permanece pública', () => {
    expect(flowStepMediaPreviewSrc('inicio', 'welcome', 'https://cdn.example/foto.jpg')).toBe(
      'https://cdn.example/foto.jpg'
    );
  });

  it('sem URL não há prévia', () => {
    expect(flowStepMediaPreviewSrc('inicio', 'welcome')).toBeNull();
    expect(flowStepMediaPreviewSrc(undefined, 'welcome', 'flows/inicio/welcome')).toBeNull();
  });
});

describe('flowStepMediaFileError', () => {
  it('aceita imagem, vídeo, áudio e PDF', () => {
    expect(
      flowStepMediaFileError(new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }))
    ).toBeNull();
    expect(
      flowStepMediaFileError(new File([new Uint8Array([1])], 'a.mp4', { type: 'video/mp4' }))
    ).toBeNull();
    expect(
      flowStepMediaFileError(new File([new Uint8Array([1])], 'a.ogg', { type: 'audio/ogg' }))
    ).toBeNull();
    expect(
      flowStepMediaFileError(new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' }))
    ).toBeNull();
  });

  it('recusa documento que não é PDF', () => {
    expect(
      flowStepMediaFileError(new File([new Uint8Array([1])], 'a.zip', { type: 'application/zip' }))
    ).toBe('Só é permitido imagem, vídeo, áudio ou PDF');
  });
});
