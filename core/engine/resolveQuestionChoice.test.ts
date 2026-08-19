import { resolveQuestionChoice } from './resolveQuestionChoice';

const question = {
  options: ['Suporte', 'Vendas', 'Financeiro'],
};

describe('resolveQuestionChoice', () => {
  it('1, 1. e 1) viram a primeira opção', () => {
    expect(resolveQuestionChoice(question, '1')).toBe('Suporte');
    expect(resolveQuestionChoice(question, '1.')).toBe('Suporte');
    expect(resolveQuestionChoice(question, '1)')).toBe('Suporte');
    expect(resolveQuestionChoice(question, ' 2 ')).toBe('Vendas');
  });

  it('texto livre permanece', () => {
    expect(resolveQuestionChoice(question, 'Suporte técnico')).toBe('Suporte técnico');
    expect(resolveQuestionChoice(question, '1 atendente')).toBe('1 atendente');
  });

  it('número fora da lista não mapeia', () => {
    expect(resolveQuestionChoice(question, '9')).toBe('9');
    expect(resolveQuestionChoice({ options: [] }, '1')).toBe('1');
  });
});
