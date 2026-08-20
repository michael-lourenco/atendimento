'use client';

import { FLOW_STEP_MAX_DELAY_MS, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { Input } from '@/ui/components/input';
import { Textarea } from '@/ui/components/textarea';
import { FlowQuestionOptions } from '@/ui/components/flow-question-options';
import { FlowStepActionFields } from '@/ui/components/flow-step-action-fields';
import { flowSelectClass } from '@/ui/components/flow-next-step-select';
import { stepDisplayName } from '@/ui/lib/flow-step-copy';

type FlowStepInspectorProps = {
  step: FlowStep;
  index: number;
  steps: FlowStep[];
  departments: Department[];
  flows: { id: string; isActive: boolean; name: string }[];
  onPatch: (next: FlowStep) => void;
  onOpenFlow?: (flowId: string) => void;
  onRemove: () => void;
};

export function FlowStepInspector({
  step,
  index,
  steps,
  departments,
  flows,
  onPatch,
  onOpenFlow,
  onRemove,
}: FlowStepInspectorProps) {
  const jumpTargets = flows.filter((item) => item.isActive);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{stepDisplayName(step, index, departments, flows)}</p>
      {step.type !== 'action' && step.type !== 'condition' ? (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            {step.type === 'question' ? 'Pergunta' : 'Texto'}
          </Label>
          <Textarea
            value={step.content}
            rows={3}
            onChange={(event) => onPatch({ ...step, content: event.target.value })}
          />
        </div>
      ) : null}
      {step.type === 'message' ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Pausa antes (ms)</Label>
            <Input
              type="number"
              min={0}
              max={FLOW_STEP_MAX_DELAY_MS}
              value={step.delayMs ?? 0}
              onChange={(event) =>
                onPatch({ ...step, delayMs: Number(event.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mídia (URL)</Label>
            <Input
              value={step.mediaUrl ?? ''}
              onChange={(event) => onPatch({ ...step, mediaUrl: event.target.value })}
            />
            <select
              className={flowSelectClass}
              value={step.mediaKind ?? 'image'}
              aria-label="Tipo da mídia"
              onChange={(event) =>
                onPatch({ ...step, mediaKind: event.target.value as 'image' | 'audio' })
              }
            >
              <option value="image">Imagem</option>
              <option value="audio">Áudio</option>
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
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        Remover bloco
      </Button>
    </div>
  );
}
