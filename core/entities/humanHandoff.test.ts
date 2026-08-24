import { matchesHumanHandoff } from './humanHandoff';

describe('matchesHumanHandoff', () => {
  it('casa 0 só igualzinho', () => {
    expect(matchesHumanHandoff('0')).toBe(true);
    expect(matchesHumanHandoff('10')).toBe(false);
    expect(matchesHumanHandoff('01')).toBe(false);
  });

  it('casa humano no meio da frase', () => {
    expect(matchesHumanHandoff('quero um humano agora')).toBe(true);
    expect(matchesHumanHandoff('Atendente')).toBe(true);
    expect(matchesHumanHandoff('falar com humano')).toBe(true);
  });

  it('ignora texto comum do menu', () => {
    expect(matchesHumanHandoff('1')).toBe(false);
    expect(matchesHumanHandoff('oi')).toBe(false);
  });
});
