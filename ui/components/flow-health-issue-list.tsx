'use client';

import { FlowHealthIssue } from '@/core/engine/flowHealth';
import { isFlowHealthIssueClickable } from '@/ui/lib/flow-health-list';

type FlowHealthIssueListProps = {
  issues: FlowHealthIssue[];
  onSelect: (stepId: string) => void;
};

export function FlowHealthIssueList({ issues, onSelect }: FlowHealthIssueListProps) {
  if (issues.length === 0) {
    return null;
  }
  return (
    <ul className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {issues.map((issue, index) => {
        const clickable = isFlowHealthIssueClickable(issue);
        return (
          <li key={`${issue.stepId ?? 'none'}-${issue.message}-${index}`}>
            {clickable ? (
              <button
                type="button"
                className="text-left underline-offset-2 hover:underline"
                onClick={() => onSelect(issue.stepId!.trim())}
              >
                {issue.message}
              </button>
            ) : (
              issue.message
            )}
          </li>
        );
      })}
    </ul>
  );
}
