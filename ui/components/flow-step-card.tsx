'use client';

import { FlowStep, FlowStepMediaKind } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { Input } from '@/ui/components/input';
import { Textarea } from '@/ui/components/textarea';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  STEP_TYPE_LABELS,
  stepCollapsedHint,
  stepDisplayName,
} from '@/ui/lib/flow-step-copy';
import { withStepType } from '@/ui/lib/flow-step-graph';
import { flowSelectClass } from '@/ui/components/flow-next-step-select';
import { FlowConditionFields } from '@/ui/components/flow-condition-fields';
import { FlowQuestionOptions } from '@/ui/components/flow-question-options';
import { FlowStepActionFields } from '@/ui/components/flow-step-action-fields';
import { flowStepToneBar } from '@/ui/lib/status-tone';
import {
  FLOW_STEP_MAX_DELAY_SECONDS,
  flowStepDelayMsFromSeconds,
  flowStepDelaySeconds,
} from '@/ui/lib/flow-step-delay';

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
  showReorder?: boolean;
  collapsible?: boolean;
  onToggle: () => void;
  onChange: (steps: FlowStep[]) => void;
  onPatch: (next: FlowStep) => void;
  onPatchAt: (index: number, next: FlowStep) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  onOpenFlow?: (flowId: string) => void;
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
  showReorder = true,
  collapsible = true,
  onToggle,
  onChange,
  onPatch,
  onPatchAt,
  onMove,
  onRemove,
  onOpenFlow,
}: FlowStepCardProps) {
  const hasOptionChain = ownedConditions.length > 0;
  const jumpTargets = flows.filter((item) => item.isActive);

  const open = !collapsible || expanded;

  return (
    <div
      id={`flow-step-${step.id}`}
      className={`rounded-md border border-border border-l-4 ${flowStepToneBar[step.type]}`}
    >
      <div className="flex items-start gap-1 p-3">
        {collapsible ? (
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            <p className="text-sm font-medium text-foreground">
              {stepDisplayName(step, visibleIndex, departments, flows)}
            </p>
            {!open ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stepCollapsedHint(step, departments, flows)} · clique para editar
              </p>
            ) : null}
          </button>
        ) : (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {stepDisplayName(step, visibleIndex, departments, flows)}
            </p>
          </div>
        )}
        {showReorder ? (
          <>
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
          </>
        ) : null}
      </div>
      {open ? (
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
          {step.type === 'message' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Pausa antes (segundos)</Label>
                <Input
                  type="number"
                  min={0}
                  max={FLOW_STEP_MAX_DELAY_SECONDS}
                  step={0.1}
                  value={flowStepDelaySeconds(step.delayMs)}
                  onChange={(event) =>
                    onPatch({ ...step, delayMs: flowStepDelayMsFromSeconds(event.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mídia (URL http)</Label>
                <Input
                  value={step.mediaUrl ?? ''}
                  placeholder="https://…"
                  onChange={(event) => onPatch({ ...step, mediaUrl: event.target.value })}
                />
                <select
                  className={flowSelectClass}
                  value={step.mediaKind ?? 'image'}
                  aria-label="Tipo da mídia"
                  onChange={(event) =>
                    onPatch({ ...step, mediaKind: event.target.value as FlowStepMediaKind })
                  }
                >
                  <option value="image">Imagem</option>
                  <option value="audio">Áudio</option>
                  <option value="video">Vídeo</option>
                  <option value="document">PDF</option>
                </select>
              </div>
            </div>
          ) : null}
          {step.type === 'question' ? (
            <FlowQuestionOptions
              steps={steps}
              index={index}
              departments={departments}
              flows={jumpTargets}
              onPatch={onPatch}
            />
          ) : null}
          {step.type === 'action' ? (
            <FlowStepActionFields
              step={step}
              departments={departments}
              jumpTargets={jumpTargets}
              onPatch={onPatch}
              onOpenFlow={onOpenFlow}
            />
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
