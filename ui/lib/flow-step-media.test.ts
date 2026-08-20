import { flowStepMediaPreviewSrc } from './flow-step-media';

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
