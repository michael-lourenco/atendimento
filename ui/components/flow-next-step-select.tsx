'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Label } from '@/ui/components/label';
import { END_STEP_LABEL, stepDisplayName } from '@/ui/lib/flow-step-copy';

export const flowSelectClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';

type NextStepSelectProps = {
  steps: FlowStep[];
  departments: Department[];
  flows?: { id: string; name: string }[];
  currentId: string;
  value: string;
  label: string;
  onChange: (nextStepId: string) => void;
};

export function NextStepSelect({
  steps,
  departments,
  flows = [],
  currentId,
  value,
  label,
  onChange,
}: NextStepSelectProps) {
  const options = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.id !== currentId);
  const known = options.some(({ step }) => step.id === value);

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <select
        className={flowSelectClass}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{END_STEP_LABEL}</option>
        {!known && value ? <option value={value}>{value}</option> : null}
        {options.map(({ step, index }) => (
          <option key={step.id} value={step.id}>
            {stepDisplayName(step, index, departments, flows)}
          </option>
        ))}
      </select>
    </div>
  );
}
