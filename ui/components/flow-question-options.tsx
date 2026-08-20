'use client';

import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { optionBranchLabel } from '@/ui/lib/flow-step-outline';
import { FlowStep } from '@/core/entities/Flow';

type FlowQuestionOptionsProps = {
  steps: FlowStep[];
  index: number;
  departments: Department[];
  flows?: { id: string; name: string }[];
  onPatch: (next: FlowStep) => void;
};

export function FlowQuestionOptions({
  steps,
  index,
  departments,
  flows = [],
  onPatch,
}: FlowQuestionOptionsProps) {
  const step = steps[index];
  const optionRows = step.options ?? [];

  const setOptionAt = (optionIndex: number, value: string) => {
    const next = [...optionRows];
    next[optionIndex] = value;
    onPatch({ ...step, options: next });
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">
        Opções (1, 2, 3…). Puxe a bolinha no quadro até o próximo bloco.
      </Label>
      {optionRows.map((option, optionIndex) => {
        const trimmed = option.trim();
        return (
          <div key={`opt-${optionIndex}`} className="flex items-start gap-2">
            <span className="mt-2 w-6 shrink-0 text-sm font-medium text-muted-foreground">
              {optionIndex + 1}.
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <Input
                value={option}
                placeholder="Texto da opção"
                onChange={(event) => setOptionAt(optionIndex, event.target.value)}
              />
              {trimmed ? (
                <p className="text-xs text-muted-foreground">
                  {optionBranchLabel(steps, step, trimmed, departments, flows)}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                onPatch({
                  ...step,
                  options: optionRows.filter((_, i) => i !== optionIndex),
                })
              }
            >
              Tirar
            </Button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPatch({ ...step, options: [...optionRows, ''] })}
      >
        Adicionar opção
      </Button>
    </div>
  );
}
