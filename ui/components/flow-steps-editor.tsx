'use client';

import { Flow, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { useEffect, useState } from 'react';
import {
  addFlowKind,
  duplicateVisibleFlowStep,
  FlowAddKind,
  moveStepToStart,
} from '@/ui/lib/flow-step-graph';
import { applyCanvasLayout, fallbackCanvasPosition } from '@/ui/lib/flow-canvas-layout';
import { conditionsOwnedByQuestion } from '@/ui/lib/flow-option-paths';
import { removeVisibleFlowStep, visibleFlowSteps } from '@/ui/lib/flow-step-outline';
import { flowHealthIssues } from '@/ui/lib/flow-health';
import { FlowSimulator } from '@/ui/components/flow-simulator';
import { FlowStepCard } from '@/ui/components/flow-step-card';
import { FlowCanvasBoard } from '@/ui/components/flow-canvas-board';
import { FlowCanvasPalette } from '@/ui/components/flow-canvas-palette';

type FlowStepsEditorProps = {
  steps: FlowStep[];
  departments: Department[];
  flows?: Flow[];
  currentFlowId?: string;
  onChange: (steps: FlowStep[]) => void;
  onOpenFlow?: (flowId: string) => void;
};

export function FlowStepsEditor({
  steps,
  departments,
  flows = [],
  currentFlowId,
  onChange,
  onOpenFlow,
}: FlowStepsEditorProps) {
  const activeDepartments = departments.filter((item) => item.isActive);
  const jumpTargets = flows.filter(
    (item) => item.isActive && item.id !== currentFlowId && item.id !== 'preview'
  );
  const visible = visibleFlowSteps(steps);
  const issues = flowHealthIssues(steps, jumpTargets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulateOpen, setSimulateOpen] = useState(false);

  useEffect(() => {
    if (selectedId && !steps.some((step) => step.id === selectedId)) {
      setSelectedId(null);
    }
  }, [steps, selectedId]);

  useEffect(() => {
    onChange(applyCanvasLayout(steps, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlowId]);

  const selectedIndex = steps.findIndex((step) => step.id === selectedId);
  const selected = selectedIndex >= 0 ? steps[selectedIndex] : null;
  const selectedVisibleIndex = visible.findIndex((item) => item.step.id === selectedId);
  const selectedIssues = issues.filter((issue) => issue.stepId === selectedId);

  const patch = (index: number, next: FlowStep) => {
    onChange(steps.map((step, i) => (i === index ? next : step)));
  };

  const add = (kind: FlowAddKind) => {
    const next = addFlowKind(steps, kind, {
      linkPrevious: false,
      canvasPosition: fallbackCanvasPosition(visible.length),
    });
    setSelectedId(next[next.length - 1]?.id ?? null);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Roteiro no WhatsApp</Label>
        <p className="text-xs text-muted-foreground">
          Arraste os blocos. Puxe a bolinha até o próximo. Clique para editar.
        </p>
      </div>
      {issues.length > 0 ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {issues.length === 1 ? issues[0].message : `${issues.length} problemas no roteiro`}
        </p>
      ) : null}
      <FlowCanvasPalette onAdd={add} />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(applyCanvasLayout(steps, true))}
          disabled={visible.length === 0}
        >
          Organizar
        </Button>
        {selected ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const next = duplicateVisibleFlowStep(steps, selected.id);
              setSelectedId(next[next.length - 1]?.id ?? null);
              onChange(next);
            }}
          >
            Duplicar bloco
          </Button>
        ) : null}
        {selected && steps[0]?.id !== selected.id ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(moveStepToStart(steps, selected.id))}
          >
            Começar por este bloco
          </Button>
        ) : null}
        <Button
          type="button"
          variant={simulateOpen ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSimulateOpen((open) => !open)}
        >
          Simular
        </Button>
      </div>
      <div className="relative">
        <FlowCanvasBoard
          steps={steps}
          departments={activeDepartments}
          flows={jumpTargets}
          selectedId={selectedId}
          fitSeed={currentFlowId || 'new'}
          onChange={onChange}
          onSelect={setSelectedId}
        />
        {selected || simulateOpen ? (
          <aside className="absolute inset-x-3 bottom-3 z-10 flex max-h-[48%] flex-col gap-2 overflow-y-auto rounded-md border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm md:inset-y-3 md:left-auto md:right-3 md:w-[340px] md:max-h-none">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {simulateOpen && !selected ? 'Simular conversa' : 'Editar bloco'}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedId(null);
                  setSimulateOpen(false);
                }}
              >
                Fechar
              </Button>
            </div>
            {simulateOpen ? (
              <FlowSimulator
                steps={steps}
                flows={jumpTargets}
                flowId={currentFlowId || 'preview'}
              />
            ) : null}
            {selected && selectedIndex >= 0 ? (
              <>
                {selectedIssues.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-destructive">
                    {selectedIssues.map((issue) => (
                      <li key={issue.message}>{issue.message}</li>
                    ))}
                  </ul>
                ) : null}
                <FlowStepCard
                  step={selected}
                  index={selectedIndex}
                  visibleIndex={selectedVisibleIndex >= 0 ? selectedVisibleIndex : selectedIndex}
                  visibleCount={visible.length}
                  steps={steps}
                  departments={activeDepartments}
                  flows={jumpTargets}
                  expanded
                  collapsible={false}
                  showReorder={false}
                  ownedConditions={conditionsOwnedByQuestion(steps, selected)}
                  onToggle={() => undefined}
                  onChange={onChange}
                  onPatch={(next) => patch(selectedIndex, next)}
                  onPatchAt={patch}
                  onMove={() => undefined}
                  onOpenFlow={onOpenFlow}
                  onRemove={() => {
                    const next = removeVisibleFlowStep(steps, selected.id);
                    onChange(next);
                    setSelectedId(null);
                  }}
                />
              </>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
