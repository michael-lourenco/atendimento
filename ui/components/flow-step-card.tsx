'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  STEP_TYPE_LABELS,
  stepCollapsedHint,
  stepDisplayName,
} from '@/ui/lib/flow-step-copy';
import { withStepType } from '@/ui/lib/flow-step-graph';
import { NextStepSelect, flowSelectClass } from '@/ui/components/flow-next-step-select';
import { FlowConditionFields } from '@/ui/components/flow-condition-fields';
import { FlowQuestionOptions } from '@/ui/components/flow-question-options';
import { flowStepToneBar } from '@/ui/lib/status-tone';

const TYPES: FlowStep['type'][] = ['message', 'question', 'condition', 'action'];

type FlowStepCardProps = {
  step: FlowStep;
  index: number;
  visibleIndex: number;
  visibleCount: number;
  steps: FlowStep[];
  departments: Department[];
  flows?: { id: string; isActive: boolean; name: string }[];
  expanded: boolean;
  ownedConditions: FlowStep[];
  onToggle: () => void;
  onChange: (steps: FlowStep[]) => void;
  onPatch: (next: FlowStep) => void;
  onPatchAt: (index: number, next: FlowStep) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

export function FlowStepCard({
  step,
  index,
  visibleIndex,
  visibleCount,
  steps,
  departments,
  flows = [],
  expanded,
  ownedConditions,
  onToggle,
  onChange,
  onPatch,
  onPatchAt,
  onMove,
  onRemove,
}: FlowStepCardProps) {
  const hasOptionChain = ownedConditions.length > 0;
  const jumpsToFlow = step.action?.type === 'goToFlow';
  const jumpTargets = flows.filter((item) => item.isActive);

  return (
    <div
      id={`flow-step-${step.id}`}
      className={`rounded-md border border-border border-l-4 ${flowStepToneBar[step.type]}`}
    >
      <div className="flex items-start gap-1 p-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <p className="text-sm font-medium text-foreground">
            {stepDisplayName(step, visibleIndex, departments, flows)}
          </p>
          {!expanded ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {stepCollapsedHint(step, departments, flows)} · clique para editar
            </p>
          ) : null}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Mover para cima"
          disabled={visibleIndex === 0}
          onClick={() => onMove(-1)}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Mover para baixo"
          disabled={visibleIndex === visibleCount - 1}
          onClick={() => onMove(1)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      {expanded ? (
        <div className="space-y-3 border-t border-border p-3">
          {step.type !== 'action' && step.type !== 'condition' ? (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {step.type === 'question' ? 'Pergunta no WhatsApp' : 'Texto no WhatsApp'}
              </Label>
              <Textarea
                value={step.content}
                rows={step.type === 'message' ? 3 : 2}
                placeholder={
                  step.type === 'question'
                    ? 'Ex.: Como podemos ajudar?'
                    : 'Ex.: Olá! Bem-vindo ao atendimento.'
                }
                onChange={(event) => onPatch({ ...step, content: event.target.value })}
              />
            </div>
          ) : null}
          {step.type === 'question' ? (
            <FlowQuestionOptions
              steps={steps}
              index={index}
              departments={departments}
              flows={jumpTargets}
              onChangeSteps={onChange}
              onPatch={onPatch}
            />
          ) : null}
          {step.type === 'action' ? (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Esta ação</Label>
                <select
                  className={flowSelectClass}
                  value={jumpsToFlow ? 'goToFlow' : 'setDepartment'}
                  aria-label="Tipo da ação"
                  onChange={(event) =>
                    onPatch({
                      ...step,
                      action:
                        event.target.value === 'goToFlow'
                          ? { type: 'goToFlow', flowId: '' }
                          : { type: 'setDepartment', departmentId: '' },
                    })
                  }
                >
                  <option value="setDepartment">Definir setor</option>
                  <option value="goToFlow">Ir para outro fluxo</option>
                </select>
              </div>
              {jumpsToFlow ? (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Fluxo destino</Label>
                  <select
                    className={flowSelectClass}
                    value={step.action?.type === 'goToFlow' ? step.action.flowId : ''}
                    aria-label="Fluxo destino"
                    onChange={(event) =>
                      onPatch({
                        ...step,
                        action: { type: 'goToFlow', flowId: event.target.value },
                      })
                    }
                  >
                    <option value="">Escolha o fluxo…</option>
                    {jumpTargets.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    O cliente continua nesse fluxo. O de entrada (selo WhatsApp) não muda.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Setor da conversa</Label>
                  <select
                    className={flowSelectClass}
                    value={step.action?.type === 'setDepartment' ? step.action.departmentId : ''}
                    aria-label="Setor da ação"
                    onChange={(event) =>
                      onPatch({
                        ...step,
                        action: { type: 'setDepartment', departmentId: event.target.value },
                      })
                    }
                  >
                    <option value="">Escolha o setor…</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : null}
          {step.type === 'condition' && step.condition ? (
            <FlowConditionFields
              step={step}
              steps={steps}
              departments={departments}
              onChange={onPatch}
            />
          ) : null}
          {step.type === 'question' && hasOptionChain ? (
            <details className="rounded-md border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Como o bot reconhece as respostas
              </summary>
              <p className="mt-2 text-xs text-muted-foreground">
                Cada opção vira uma regra. O cliente pode digitar o número ou o texto.
              </p>
              <div className="mt-3 space-y-3">
                {ownedConditions.map((condition) => {
                  const conditionIndex = steps.findIndex((item) => item.id === condition.id);
                  if (conditionIndex < 0) {
                    return null;
                  }
                  return (
                    <div key={condition.id} className="rounded-md border border-border bg-background p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {stepDisplayName(steps[conditionIndex], conditionIndex, departments, flows)}
                      </p>
                      <FlowConditionFields
                        step={steps[conditionIndex]}
                        steps={steps}
                        departments={departments}
                        onChange={(next) => onPatchAt(conditionIndex, next)}
                      />
                    </div>
                  );
                })}
              </div>
            </details>
          ) : null}
          {step.type !== 'condition' &&
          !(step.type === 'question' && hasOptionChain) &&
          !jumpsToFlow ? (
            <NextStepSelect
              steps={steps}
              departments={departments}
              flows={flows}
              currentId={step.id}
              value={step.nextStepId ?? ''}
              label="Depois, ir para"
              onChange={(nextStepId) => onPatch({ ...step, nextStepId: nextStepId || undefined })}
            />
          ) : null}
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Tipo deste bloco</summary>
            <select
              className={`${flowSelectClass} mt-2`}
              value={step.type}
              aria-label="Tipo do passo"
              onChange={(event) =>
                onPatch(withStepType(step, event.target.value as FlowStep['type']))
              }
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {STEP_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </details>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remover
          </Button>
        </div>
      ) : null}
    </div>
  );
}
