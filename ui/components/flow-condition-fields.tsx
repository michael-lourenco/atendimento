'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { NextStepSelect, flowSelectClass } from '@/ui/components/flow-next-step-select';
import { CONDITION_OPERATOR_LABELS } from '@/ui/lib/flow-step-copy';
import {
  optionMatchesConditionValue,
  questionOptionsForCondition,
} from '@/ui/lib/flow-step-graph';

const OPERATORS = Object.keys(CONDITION_OPERATOR_LABELS) as Array<
  NonNullable<FlowStep['condition']>['operator']
>;

type FlowConditionFieldsProps = {
  step: FlowStep;
  steps: FlowStep[];
  departments: Department[];
  onChange: (next: FlowStep) => void;
};

export function FlowConditionFields({
  step,
  steps,
  departments,
  onChange,
}: FlowConditionFieldsProps) {
  const condition = step.condition;
  if (!condition) {
    return null;
  }

  const questionOptions = questionOptionsForCondition(steps, step.id);
  const patchCondition = (partial: Partial<NonNullable<FlowStep['condition']>>) => {
    onChange({ ...step, condition: { ...condition, ...partial } });
  };

  return (
    <div className="space-y-2">
      {questionOptions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Se a resposta for</p>
          <div className="flex flex-wrap gap-2">
            {questionOptions.map((option) => {
              const selected = optionMatchesConditionValue(option, condition.value);
              return (
                <Button
                  key={option}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => patchCondition({ value: option, operator: 'equals' })}
                >
                  {option}
                </Button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Se a mensagem do cliente</p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Comparação</Label>
          <select
            className={flowSelectClass}
            value={condition.operator}
            aria-label="Comparação da condição"
            onChange={(event) =>
              patchCondition({
                operator: event.target.value as NonNullable<FlowStep['condition']>['operator'],
              })
            }
          >
            {OPERATORS.map((operator) => (
              <option key={operator} value={operator}>
                {CONDITION_OPERATOR_LABELS[operator]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {questionOptions.length > 0 ? 'Outro texto' : 'Texto'}
          </Label>
          <Input
            value={condition.value}
            placeholder={questionOptions[0] ?? 'Ex.: vendas'}
            onChange={(event) => patchCondition({ value: event.target.value })}
          />
        </div>
      </div>
      <NextStepSelect
        steps={steps}
        departments={departments}
        currentId={step.id}
        value={condition.trueStepId}
        label="Se sim, ir para"
        onChange={(trueStepId) => patchCondition({ trueStepId })}
      />
      <NextStepSelect
        steps={steps}
        departments={departments}
        currentId={step.id}
        value={condition.falseStepId}
        label="Se não, ir para"
        onChange={(falseStepId) => patchCondition({ falseStepId })}
      />
    </div>
  );
}
