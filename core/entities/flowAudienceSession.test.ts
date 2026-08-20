import { planSessionForTurn, sessionForKnownMenu } from './flowAudienceSession';

const now = new Date('2026-08-20T15:00:00Z');

describe('sessionForKnownMenu', () => {
  it('usa o fluxo de entrada quando não há sessão', () => {
    expect(sessionForKnownMenu(null, 'c1', now, 'faq').flowId).toBe('faq');
  });

  it('mantém o fluxo da sessão existente', () => {
    expect(
      sessionForKnownMenu(
        {
          contactId: 'c1',
          flowId: 'inicio',
          currentStepId: null,
          paused: false,
          updatedAt: now,
        },
        'c1',
        now,
        'faq'
      ).flowId
    ).toBe('inicio');
  });
});

describe('planSessionForTurn', () => {
  it('conhecido sem sessão aponta para o fluxo de entrada', () => {
    const planned = planSessionForTurn({
      session: null,
      audience: 'known',
      reopened: false,
      contactId: 'c1',
      now,
      entryFlowId: 'faq',
    });
    expect(planned.session?.flowId).toBe('faq');
    expect(planned.session?.currentStepId).toBeNull();
  });
});
