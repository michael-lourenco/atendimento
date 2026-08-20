import { isFlowHealthIssueClickable } from './flow-health-list';

describe('isFlowHealthIssueClickable', () => {
  it('com stepId seleciona o bloco', () => {
    expect(isFlowHealthIssueClickable({ stepId: 'welcome' })).toBe(true);
  });

  it('sem stepId não é clicável', () => {
    expect(isFlowHealthIssueClickable({})).toBe(false);
    expect(isFlowHealthIssueClickable({ stepId: '  ' })).toBe(false);
  });
});
