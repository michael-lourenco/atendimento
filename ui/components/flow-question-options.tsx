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
  hasCompleteOptionPaths,
} from '@/ui/lib/flow-option-paths';
import { listQuestionOptions } from '@/ui/lib/flow-step-graph';
import { FlowStep } from '@/core/entities/Flow';
import { useEffect, useMemo, useState } from 'react';

type FlowQuestionOptionsProps = {
  steps: FlowStep[];
  index: number;
  departments: Department[];
  onChangeSteps: (steps: FlowStep[]) => void;
  onPatch: (next: FlowStep) => void;
};

export function FlowQuestionOptions({
  steps,
  index,
  departments,
  onChangeSteps,
  onPatch,
}: FlowQuestionOptionsProps) {
  const step = steps[index];
  const options = listQuestionOptions(step);
  const ready = hasCompleteOptionPaths(steps, index);
  const defaults = useMemo(
    () => defaultOptionDestinations(options, departments),
    [options, departments]
  );
  const [destinations, setDestinations] = useState<Record<string, OptionPathDestination>>(defaults);

  useEffect(() => {
    setDestinations(defaults);
  }, [defaults]);

  const patchDestination = (option: string, next: OptionPathDestination) => {
    setDestinations((current) => ({ ...current, [option]: next }));
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Opções (separadas por vírgula)</Label>
        <Input
          value={(step.options ?? []).join(', ')}
          placeholder="Ex.: Vendas, Suporte, Financeiro"
          onChange={(event) =>
            onPatch({
              ...step,
              options: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
      {options.length > 0 ? (
        <div className="space-y-2">
          {options.map((option) => {
            const dest = destinations[option] ?? { type: 'end' };
            return (
              <div key={option} className="grid gap-2 sm:grid-cols-[1fr_minmax(0,1fr)_minmax(0,1fr)]">
                <p className="self-center truncate text-sm font-medium">{option}</p>
                <select
                  className={flowSelectClass}
                  value={dest.type}
                  aria-label={`Destino de ${option}`}
                  onChange={(event) =>
                    patchDestination(option, {
                      type: event.target.value as OptionPathDestination['type'],
                      departmentId: dest.departmentId,
                      message: dest.message,
                    })
                  }
                >
                  <option value="end">Encerrar</option>
                  <option value="department">Definir setor</option>
                  <option value="message">Enviar mensagem</option>
                </select>
                {dest.type === 'department' ? (
                  <select
                    className={flowSelectClass}
                    value={dest.departmentId ?? ''}
                    aria-label={`Setor de ${option}`}
                    onChange={(event) =>
                      patchDestination(option, { type: 'department', departmentId: event.target.value })
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
                {dest.type === 'message' ? (
                  <Input
                    value={dest.message ?? ''}
                    placeholder="Texto no WhatsApp"
                    onChange={(event) =>
                      patchDestination(option, { type: 'message', message: event.target.value })
                    }
                  />
                ) : null}
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={ready}
            onClick={() => onChangeSteps(createOptionPaths(steps, index, undefined, destinations))}
          >
            {ready ? 'Caminhos das opções prontos' : 'Criar caminhos das opções'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
