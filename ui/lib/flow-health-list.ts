import { FlowHealthIssue } from '@/core/engine/flowHealth';

export function isFlowHealthIssueClickable(issue: Pick<FlowHealthIssue, 'stepId'>): boolean {
  return Boolean(issue.stepId?.trim());
}
