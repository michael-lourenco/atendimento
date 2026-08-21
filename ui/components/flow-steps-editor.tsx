'use client';

import { Flow, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { overlayEditorOnCatalog, previewFlowTurn } from '@/core/engine/previewFlowOpening';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addFlowKind,
  duplicateVisibleFlowStep,
  FlowAddKind,
  moveStepToStart,
} from '@/ui/lib/flow-step-graph';
import { applyCanvasLayout, fallbackCanvasPosition } from '@/ui/lib/flow-canvas-layout';
import { removeVisibleFlowStep, visibleFlowSteps } from '@/ui/lib/flow-step-outline';
import { flowHealthIssues } from '@/ui/lib/flow-health';
import { FlowHealthIssueList } from '@/ui/components/flow-health-issue-list';
import { FlowSimulator } from '@/ui/components/flow-simulator';
import { FlowStepInspector } from '@/ui/components/flow-step-inspector';
import { FlowCanvasBoard } from '@/ui/components/flow-canvas-board';
import { FlowCanvasPalette } from '@/ui/components/flow-canvas-palette';
import {
  FlowSimCursor,
  isSimCanvasReadOnly,
  stepsForSimCanvas,
} from '@/ui/lib/flow-sim-canvas';

type FlowStepsEditorProps = {
  steps: FlowStep[];
  departments: Department[];
  flows?: Flow[];
  currentFlowId?: string;
  savedStepIds?: string[];
  onChange: (steps: FlowStep[]) => void;
  onOpenFlow?: (flowId: string) => void;
  onEnsureSaved?: () => Promise<string | null>;
  onPersisted?: (flowId: string) => void;
};

export function FlowStepsEditor({
  steps,
  departments,
  flows = [],
  currentFlowId,
  savedStepIds = [],
  onChange,
  onOpenFlow,
  onEnsureSaved,
  onPersisted,
}: FlowStepsEditorProps) {
  const activeDepartments = departments.filter((item) => item.isActive);
  const jumpTargets = flows.filter(
    (item) => item.isActive && item.id !== currentFlowId && item.id !== 'preview'
  );
  const simCatalog = useMemo(
    () => overlayEditorOnCatalog(flows, currentFlowId || 'preview', steps),
    [flows, currentFlowId, steps]
  );
  const visible = visibleFlowSteps(steps);
  const issues = flowHealthIssues(steps, jumpTargets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simCursor, setSimCursor] = useState<FlowSimCursor | null>(null);
  const [focusToken, setFocusToken] = useState(0);

  const onSimCursor = useCallback((cursor: FlowSimCursor) => {
    setSimCursor((current) =>
      current?.flowId === cursor.flowId && current?.stepId === cursor.stepId
        ? current
        : cursor
    );
  }, []);

  const seedCursor = useMemo((): FlowSimCursor | null => {
    if (!simulateOpen || steps.length === 0) {
      return null;
    }
    const plan = previewFlowTurn(steps, new Date(0), simCatalog, 'new', currentFlowId || 'preview');
    const last = plan.replies[plan.replies.length - 1];
    return { flowId: plan.nextSession.flowId, stepId: plan.nextSession.currentStepId ?? last?.stepId ?? null };
  }, [simulateOpen, steps, simCatalog, currentFlowId]);

  const liveCursor = simulateOpen ? simCursor ?? seedCursor : null;
  const canvasSteps = stepsForSimCanvas(steps, currentFlowId, flows, liveCursor);
  const canvasReadOnly = isSimCanvasReadOnly(currentFlowId, liveCursor);
  const canvasFlowId = liveCursor?.flowId ?? currentFlowId;
  const canvasJumpTargets = flows.filter(
    (item) => item.isActive && item.id !== canvasFlowId && item.id !== 'preview'
  );
  const simFlowName =
    flows.find((item) => item.id === liveCursor?.flowId)?.name ?? liveCursor?.flowId;

  useEffect(() => {
    if (selectedId && !steps.some((step) => step.id === selectedId)) {
      setSelectedId(null);
    }
  }, [steps, selectedId]);

  useEffect(() => {
    onChange(applyCanvasLayout(steps, false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlowId]);

  useEffect(() => {
    if (!simulateOpen) {
      setSimCursor(null);
    }
  }, [simulateOpen]);

  useEffect(() => {
    if (canvasReadOnly) {
      setSelectedId(null);
    }
  }, [canvasReadOnly]);

  useEffect(() => {
    if (!simulateOpen || !liveCursor?.stepId) {
      return;
    }
    setFocusToken((token) => token + 1);
  }, [simulateOpen, liveCursor?.flowId, liveCursor?.stepId]);

  const selectedIndex = steps.findIndex((step) => step.id === selectedId);
  const selected = !canvasReadOnly && selectedIndex >= 0 ? steps[selectedIndex] : null;
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
      <FlowHealthIssueList
        issues={issues}
        onSelect={(stepId) => {
          setSimulateOpen(false);
          setSelectedId(stepId);
          setFocusToken((token) => token + 1);
        }}
      />
      {canvasReadOnly ? null : <FlowCanvasPalette onAdd={add} />}
      {canvasReadOnly ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <p className="flex-1 text-foreground">
            Simulando: <span className="font-medium">{simFlowName}</span>. O quadro mostra esse
            fluxo (somente leitura).
          </p>
          {liveCursor && onOpenFlow ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenFlow(liveCursor.flowId)}>
              Editar este fluxo
            </Button>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(applyCanvasLayout(steps, true))}
          disabled={visible.length === 0 || canvasReadOnly}
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
          steps={canvasSteps}
          departments={activeDepartments}
          flows={canvasJumpTargets}
          selectedId={selectedId}
          highlightId={simulateOpen ? liveCursor?.stepId : null}
          readOnly={canvasReadOnly}
          fitSeed={`${currentFlowId || 'new'}:${canvasFlowId || 'edit'}:${simulateOpen ? 'sim' : 'edit'}`}
          focusNodeId={simulateOpen ? liveCursor?.stepId : selectedId}
          focusToken={focusToken}
          onChange={canvasReadOnly ? () => undefined : onChange}
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
                flows={simCatalog}
                flowId={currentFlowId || 'preview'}
                onCursor={onSimCursor}
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
                <FlowStepInspector
                  step={selected}
                  index={selectedIndex}
                  steps={steps}
                  departments={activeDepartments}
                  flows={jumpTargets}
                  flowId={currentFlowId}
                  canAttachMedia={Boolean(
                    currentFlowId && savedStepIds.includes(selected.id)
                  )}
                  onEnsureSaved={onEnsureSaved}
                  onPersisted={onPersisted}
                  onPatch={(next) => patch(selectedIndex, next)}
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
