import { Flow } from '../entities/Flow';
import { resolveActiveFlow } from './resolveActiveFlow';

function flow(id: string, name: string, isActive = true): Flow {
  return {
    id,
    name,
    isActive,
    steps: [],
    createdAt: new Date('2026-08-20T12:00:00Z'),
    updatedAt: new Date('2026-08-20T12:00:00Z'),
  };
}

const inicio = flow('inicio', 'Atendimento Inicial');
const faq = flow('faq', 'FAQ');

describe('resolveActiveFlow', () => {
  it('usa o flowId do chatbot quando não há sessão', () => {
    expect(resolveActiveFlow([inicio, faq], { entryFlowId: 'faq' })?.id).toBe('faq');
  });

  it('sessão em andamento não troca pelo flowId do chatbot', () => {
    expect(
      resolveActiveFlow([inicio, faq], { sessionFlowId: 'inicio', entryFlowId: 'faq' })?.id
    ).toBe('inicio');
  });

  it('entry inativo cai no inicio', () => {
    expect(
      resolveActiveFlow([inicio, flow('faq', 'FAQ', false)], { entryFlowId: 'faq' })?.id
    ).toBe('inicio');
  });

  it('sem entry usa inicio', () => {
    expect(resolveActiveFlow([faq, inicio])?.id).toBe('inicio');
  });
});
