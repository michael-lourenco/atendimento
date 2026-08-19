'use client';

import { Flow, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { useEffect, useRef, useState } from 'react';
import { addFlowStep, removeFlowStep } from '@/ui/lib/flow-step-graph';
import { conditionsOwnedByQuestion } from '@/ui/lib/flow-option-paths';
import { moveVisibleFlowStep, visibleFlowSteps } from '@/ui/lib/flow-step-outline';
import { FlowPathMap } from '@/ui/components/flow-path-map';
import { FlowWhatsAppPreview } from '@/ui/components/flow-whatsapp-preview';
import { FlowStepCard } from '@/ui/components/flow-step-card';

type FlowStepsEditorProps = {
  steps: FlowStep[];
  departments: Department[];
  flows?: Flow[];
  currentFlowId?: string;
  onChange: (steps: FlowStep[]) => void;
};

const ADD_KINDS = [
  { kind: 'message', label: 'Mensagem' },
  { kind: 'question', label: 'Pergunta' },
  { kind: 'action', label: 'Definir setor' },
  { kind: 'goToFlow', label: 'Ir para fluxo' },
] as const;

export function FlowStepsEditor({
  steps,
  departments,
  flows = [],
  currentFlowId,
  onChange,
}: FlowStepsEditorProps) {
  const activeDepartments = departments.filter((item) => item.isActive);
  const jumpTargets = flows.filter(
    (item) => item.isActive && item.id !== currentFlowId && item.id !== 'preview'
  );
  const visible = visibleFlowSteps(steps);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const stepCountRef = useRef(steps.length);

  useEffect(() => {
    if (expandedId && steps.some((step) => step.id === expandedId)) {
      return;
    }
    setExpandedId(visibleFlowSteps(steps)[0]?.step.id ?? null);
  }, [steps, expandedId]);

  useEffect(() => {
    if (steps.length <= stepCountRef.current) {
      stepCountRef.current = steps.length;
      return;
    }
    stepCountRef.current = steps.length;
    const last = steps[steps.length - 1];
    if (!last) {
      return;
    }
    document.getElementById(`flow-step-${last.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [steps]);

  const patch = (index: number, next: FlowStep) => {
    onChange(steps.map((step, i) => (i === index ? next : step)));
  };

  const add = (kind: (typeof ADD_KINDS)[number]['kind']) => {
    const type = kind === 'goToFlow' ? 'action' : kind;
    let next = addFlowStep(steps, undefined, type);
    if (kind === 'goToFlow') {
      const last = next[next.length - 1];
      next = [...next.slice(0, -1), { ...last, action: { type: 'goToFlow', flowId: '' } }];
    }
    setExpandedId(next[next.length - 1]?.id ?? null);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Roteiro no WhatsApp</Label>
        <p className="text-xs text-muted-foreground">
          Clique num bloco para editar. Para reutilizar outro roteiro, use Ir para fluxo.
        </p>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Comece com uma mensagem de boas-vindas ou uma pergunta de menu.
        </p>
      ) : (
        <>
          <FlowWhatsAppPreview steps={steps} flows={jumpTargets} />
          <details className="rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">Ver todas as ligações</summary>
            <div className="mt-3">
              <FlowPathMap steps={steps} departments={activeDepartments} flows={jumpTargets} />
            </div>
          </details>
        </>
      )}
      {visible.map(({ step, index }, visibleIndex) => (
        <FlowStepCard
          key={step.id}
          step={step}
          index={index}
          visibleIndex={visibleIndex}
          visibleCount={visible.length}
          steps={steps}
          departments={activeDepartments}
          flows={jumpTargets}
          expanded={expandedId === step.id}
          ownedConditions={conditionsOwnedByQuestion(steps, step)}
          onToggle={() => setExpandedId((current) => (current === step.id ? null : step.id))}
          onChange={onChange}
          onPatch={(next) => patch(index, next)}
          onPatchAt={patch}
          onMove={(direction) => onChange(moveVisibleFlowStep(steps, step.id, direction))}
          onRemove={() => onChange(removeFlowStep(steps, index))}
        />
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Adicionar</span>
        {ADD_KINDS.map((item) => (
          <Button
            key={item.kind}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add(item.kind)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
