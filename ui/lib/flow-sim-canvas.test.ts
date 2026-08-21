import { Flow } from '@/core/entities/Flow';
import { isSimCanvasReadOnly, stepsForSimCanvas } from './flow-sim-canvas';

const inicioSteps = [{ id: 'w', type: 'message' as const, content: 'Olá' }];
const faqSteps = [{ id: 'h', type: 'message' as const, content: 'Ajuda' }];

const faq: Flow = {
  id: 'faq',
  name: 'FAQ',
  isActive: true,
  steps: faqSteps,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

describe('stepsForSimCanvas', () => {
  it('usa o destino quando a sessão saiu do fluxo em edição', () => {
    expect(
      stepsForSimCanvas(inicioSteps, 'inicio', [faq], { flowId: 'faq', stepId: 'h' })
    ).toEqual(faqSteps);
  });

  it('mantém o editor quando a sessão ainda é o fluxo aberto', () => {
    expect(
      stepsForSimCanvas(inicioSteps, 'inicio', [faq], { flowId: 'inicio', stepId: 'w' })
    ).toEqual(inicioSteps);
  });
});

describe('isSimCanvasReadOnly', () => {
  it('trava o quadro só no fluxo visitado', () => {
    expect(isSimCanvasReadOnly('inicio', { flowId: 'faq', stepId: 'h' })).toBe(true);
    expect(isSimCanvasReadOnly('inicio', { flowId: 'inicio', stepId: 'w' })).toBe(false);
  });
});
