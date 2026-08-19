'use client';

import { Flow, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import { useEffect, useState } from 'react';
import { addFlowKind, FlowAddKind, moveStepToStart } from '@/ui/lib/flow-step-graph';
import { applyCanvasLayout, fallbackCanvasPosition } from '@/ui/lib/flow-canvas-layout';
import { conditionsOwnedByQuestion } from '@/ui/lib/flow-option-paths';
import { removeVisibleFlowStep, visibleFlowSteps } from '@/ui/lib/flow-step-outline';
import { FlowWhatsAppPreview } from '@/ui/components/flow-whatsapp-preview';
import { FlowStepCard } from '@/ui/components/flow-step-card';
import { FlowCanvasBoard } from '@/ui/components/flow-canvas-board';
import { FlowCanvasPalette } from '@/ui/components/flow-canvas-palette';

type FlowStepsEditorProps = {
  steps: FlowStep[];
  departments: Department[];
  flows?: Flow[];
  currentFlowId?: string;
  onChange: (steps: FlowStep[]) => void;
};

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
  const [selectedId, setSelectedId] = useState<string | null>(
    () => visibleFlowSteps(steps)[0]?.step.id ?? null
  );

  useEffect(() => {
    if (selectedId && !steps.some((step) => step.id === selectedId)) {
      setSelectedId(null);
    }
  }, [steps, selectedId]);

  useEffect(() => {
    onChange(applyCanvasLayout(steps, false));
    // Abre o fluxo: se não houver posição salva, organiza o quadro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFlowId]);

  const selectedIndex = steps.findIndex((step) => step.id === selectedId);
  const selected = selectedIndex >= 0 ? steps[selectedIndex] : null;
  const selectedVisibleIndex = visible.findIndex((item) => item.step.id === selectedId);

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
          Arraste os blocos. Puxe a bolinha de um bloco até o próximo. Clique para editar o texto.
        </p>
      </div>
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
      </div>
      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <FlowCanvasBoard
          steps={steps}
          departments={activeDepartments}
          flows={jumpTargets}
          selectedId={selectedId}
          fitSeed={currentFlowId || 'new'}
          onChange={onChange}
          onSelect={setSelectedId}
        />
        <div className="space-y-3">
          <FlowWhatsAppPreview steps={steps} flows={jumpTargets} />
          {selected && selectedIndex >= 0 ? (
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
              onRemove={() => {
                const next = removeVisibleFlowStep(steps, selected.id);
                onChange(next);
                setSelectedId(null);
              }}
            />
          ) : (
            <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
              Clique num bloco no quadro para editar o texto, as opções ou o destino.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
