'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { Input } from '@/ui/components/input';
import { Textarea } from '@/ui/components/textarea';
import { FlowQuestionOptions } from '@/ui/components/flow-question-options';
import { FlowStepActionFields } from '@/ui/components/flow-step-action-fields';
import { FlowStepMediaFields } from '@/ui/components/flow-step-media-fields';
import { stepDisplayName } from '@/ui/lib/flow-step-copy';
import {
  FLOW_STEP_MAX_DELAY_SECONDS,
  flowStepDelayMsFromSeconds,
  flowStepDelaySeconds,
} from '@/ui/lib/flow-step-delay';

type FlowStepInspectorProps = {
  step: FlowStep;
  index: number;
  steps: FlowStep[];
  departments: Department[];
  flows: { id: string; isActive: boolean; name: string }[];
  flowId?: string;
  canAttachMedia?: boolean;
  onEnsureSaved?: () => Promise<string | null>;
  onPersisted?: (flowId: string) => void;
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
  flowId,
  canAttachMedia = false,
  onEnsureSaved,
  onPersisted,
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
          <FlowStepMediaFields
            flowId={flowId}
            canAttach={canAttachMedia}
            step={step}
            onPatch={onPatch}
            onEnsureSaved={onEnsureSaved}
            onPersisted={onPersisted}
          />
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
