'use client';

import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { flowSelectClass } from '@/ui/components/flow-next-step-select';
import {
  OptionPathDestination,
  createOptionPaths,
  defaultOptionDestinations,
  destinationsSyncKey,
  hasCompleteOptionPaths,
} from '@/ui/lib/flow-option-paths';
import { optionBranchLabel } from '@/ui/lib/flow-step-outline';
import { FlowStep } from '@/core/entities/Flow';
import { useState } from 'react';

type FlowQuestionOptionsProps = {
  steps: FlowStep[];
  index: number;
  departments: Department[];
  flows?: { id: string; name: string }[];
  onChangeSteps: (steps: FlowStep[]) => void;
  onPatch: (next: FlowStep) => void;
};

export function FlowQuestionOptions({
  steps,
  index,
  departments,
  flows = [],
  onChangeSteps,
  onPatch,
}: FlowQuestionOptionsProps) {
  const step = steps[index];
  const optionRows = step.options ?? [];
  const filled = optionRows.map((item) => item.trim()).filter(Boolean);
  const ready = hasCompleteOptionPaths(steps, index);
  const syncKey = destinationsSyncKey(filled, departments);
  const [destinations, setDestinations] = useState(() =>
    defaultOptionDestinations(filled, departments)
  );
  const [appliedKey, setAppliedKey] = useState(syncKey);
  const visibleDestinations =
    appliedKey === syncKey ? destinations : defaultOptionDestinations(filled, departments);

  if (appliedKey !== syncKey) {
    setAppliedKey(syncKey);
    setDestinations(visibleDestinations);
  }

  const patchDestination = (option: string, next: OptionPathDestination) => {
    setDestinations((current) => ({ ...current, [option]: next }));
  };

  const setOptionAt = (optionIndex: number, value: string) => {
    const next = [...optionRows];
    next[optionIndex] = value;
    onPatch({ ...step, options: next });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Opções (o cliente vê 1, 2, 3… e pode responder com o número ou o texto)
        </Label>
        {optionRows.map((option, optionIndex) => {
          const trimmed = option.trim();
          const dest = trimmed
            ? visibleDestinations[trimmed] ?? { type: 'end' as const }
            : { type: 'end' as const };
          return (
            <div key={`opt-${optionIndex}`} className="space-y-2 rounded-md border border-border p-2">
              <div className="flex gap-2">
                <span className="mt-2 w-6 shrink-0 text-sm font-medium text-muted-foreground">
                  {optionIndex + 1}.
                </span>
                <Input
                  value={option}
                  placeholder="Texto da opção"
                  onChange={(event) => setOptionAt(optionIndex, event.target.value)}
                />
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
              {trimmed ? (
                <p className="pl-8 text-xs text-muted-foreground">
                  {optionBranchLabel(steps, step, trimmed, departments, flows)}
                </p>
              ) : null}
              {trimmed && !ready ? (
                <div className="grid gap-2 pl-8 sm:grid-cols-2">
                  <select
                    className={flowSelectClass}
                    value={dest.type}
                    aria-label={`Destino de ${trimmed}`}
                    onChange={(event) =>
                      patchDestination(trimmed, {
                        type: event.target.value as OptionPathDestination['type'],
                        departmentId: dest.departmentId,
                        message: dest.message,
                      })
                    }
                  >
                    <option value="end">Encerrar</option>
                    <option value="department">Definir setor</option>
                    <option value="message">Enviar mensagem</option>
                    <option value="flow">Ir para fluxo</option>
                  </select>
                  {dest.type === 'department' ? (
                    <select
                      className={flowSelectClass}
                      value={dest.departmentId ?? ''}
                      aria-label={`Setor de ${trimmed}`}
                      onChange={(event) =>
                        patchDestination(trimmed, {
                          type: 'department',
                          departmentId: event.target.value,
                        })
                      }
                    >
                      <option value="">Setor…</option>
                      {departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {dest.type === 'flow' ? (
                    <select
                      className={flowSelectClass}
                      value={dest.flowId ?? ''}
                      aria-label={`Fluxo de ${trimmed}`}
                      onChange={(event) =>
                        patchDestination(trimmed, { type: 'flow', flowId: event.target.value })
                      }
                    >
                      <option value="">Fluxo…</option>
                      {flows.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  {dest.type === 'message' ? (
                    <Input
                      value={dest.message ?? ''}
                      placeholder="Texto no WhatsApp"
                      onChange={(event) =>
                        patchDestination(trimmed, { type: 'message', message: event.target.value })
                      }
                    />
                  ) : null}
                </div>
              ) : null}
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
      {filled.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={ready}
          onClick={() => onChangeSteps(createOptionPaths(steps, index, undefined, visibleDestinations))}
        >
          {ready ? 'Caminhos das opções prontos' : 'Aplicar opções no roteiro'}
        </Button>
      ) : null}
    </div>
  );
}
