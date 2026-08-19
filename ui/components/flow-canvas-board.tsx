'use client';

import { FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  Connection,
  Edge,
  MarkerType,
  Node,
  NodeChange,
  ReactFlowProvider,
  useReactFlow,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlowCanvasNode, FlowCanvasNodeData, FlowCanvasRfNode } from '@/ui/components/flow-canvas-node';
import { FLOW_KIND_MIME } from '@/ui/components/flow-canvas-palette';
import { flowCanvasLinks, setCanvasPosition, setStepLink, sourceHandlesFor } from '@/ui/lib/flow-canvas-graph';
import { fallbackCanvasPosition } from '@/ui/lib/flow-canvas-layout';
import { stepCollapsedHint, STEP_TYPE_LABELS } from '@/ui/lib/flow-step-copy';
import { addFlowKind, FlowAddKind } from '@/ui/lib/flow-step-graph';
import { removeVisibleFlowStep, visibleFlowSteps } from '@/ui/lib/flow-step-outline';
import { useTheme } from '@/ui/contexts/ThemeContext';

const nodeTypes = { flowStep: FlowCanvasNode };

type FlowCanvasBoardProps = {
  steps: FlowStep[];
  departments: Department[];
  flows: { id: string; name: string }[];
  selectedId: string | null;
  fitSeed: string;
  onChange: (steps: FlowStep[]) => void;
  onSelect: (id: string | null) => void;
};

function nodeKind(step: FlowStep): string {
  return step.action?.type === 'goToFlow' ? 'goToFlow' : step.type;
}

function nodeTitle(step: FlowStep): string {
  return step.action?.type === 'goToFlow' ? 'Ir para fluxo' : STEP_TYPE_LABELS[step.type];
}

function toNodes(
  steps: FlowStep[],
  departments: Department[],
  flows: { id: string; name: string }[],
  selectedId: string | null
): FlowCanvasRfNode[] {
  return visibleFlowSteps(steps).map(({ step }, index) => ({
    id: step.id,
    type: 'flowStep' as const,
    position: step.canvasPosition ?? fallbackCanvasPosition(index),
    selected: step.id === selectedId,
    data: {
      title: nodeTitle(step),
      hint: stepCollapsedHint(step, departments, flows),
      isStart: steps[0]?.id === step.id,
      kind: nodeKind(step),
      handles: sourceHandlesFor(step),
    },
  }));
}

function toEdges(steps: FlowStep[]): Edge[] {
  return flowCanvasLinks(steps).map((link) => ({
    id: `${link.sourceId}-${link.sourceHandle}-${link.targetId}`,
    source: link.sourceId,
    target: link.targetId,
    sourceHandle: link.sourceHandle,
    targetHandle: 'in',
    label: link.label,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  }));
}

function FlowCanvasBoardInner({
  steps,
  departments,
  flows,
  selectedId,
  fitSeed,
  onChange,
  onSelect,
}: FlowCanvasBoardProps) {
  const { theme } = useTheme();
  const { screenToFlowPosition, fitView } = useReactFlow();
  const derived = useMemo(
    () => toNodes(steps, departments, flows, selectedId),
    [steps, departments, flows, selectedId]
  );
  const [nodes, setNodes] = useState<FlowCanvasRfNode[]>(derived);
  const edges = useMemo(() => toEdges(steps), [steps]);
  const fitted = useRef('');

  useEffect(() => {
    setNodes(derived);
  }, [derived]);

  useEffect(() => {
    if (!steps.length || fitted.current === fitSeed) {
      return;
    }
    fitted.current = fitSeed;
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.2, duration: 200 });
    });
    return () => cancelAnimationFrame(frame);
  }, [fitSeed, fitView, steps.length]);

  const onNodesChange = useCallback(
    (changes: NodeChange<FlowCanvasRfNode>[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
      for (const change of changes) {
        if (change.type === 'position' && change.dragging === false && change.position) {
          onChange(setCanvasPosition(steps, change.id, change.position));
        }
      }
    },
    [onChange, steps]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      let next = steps;
      for (const node of deleted) {
        next = removeVisibleFlowStep(next, node.id);
      }
      onChange(next);
      onSelect(null);
    },
    [onChange, onSelect, steps]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle) {
        return;
      }
      onChange(setStepLink(steps, connection.source, connection.sourceHandle, connection.target));
    },
    [onChange, steps]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      let next = steps;
      for (const edge of deleted) {
        next = setStepLink(next, edge.source, edge.sourceHandle ?? 'next', '');
      }
      onChange(next);
    },
    [onChange, steps]
  );

  const addAt = useCallback(
    (kind: FlowAddKind, position: { x: number; y: number }) => {
      const next = addFlowKind(steps, kind, { linkPrevious: false, canvasPosition: position });
      onChange(next);
      onSelect(next[next.length - 1]?.id ?? null);
    },
    [onChange, onSelect, steps]
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData(FLOW_KIND_MIME) as FlowAddKind;
      if (!kind) {
        return;
      }
      addAt(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addAt, screenToFlowPosition]
  );

  return (
    <div
      className="flow-canvas relative h-[min(70vh,640px)] overflow-hidden rounded-md border border-border bg-muted/30"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodesDelete={onNodesDelete}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeClick={(_, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(null)}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={(connection) => connection.source !== connection.target}
        colorMode={theme === 'dark' ? 'dark' : 'light'}
        defaultEdgeOptions={{ type: 'smoothstep' }}
        deleteKeyCode={['Backspace', 'Delete']}
        nodesConnectable
        elementsSelectable
      >
        <Background gap={18} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(node: Node<FlowCanvasNodeData>) => {
            const kind = node.data?.kind ?? 'message';
            if (kind === 'question') return '#f59e0b';
            if (kind === 'condition') return '#8b5cf6';
            if (kind === 'action') return '#10b981';
            return '#0ea5e9';
          }}
        />
      </ReactFlow>
      {visibleFlowSteps(steps).length === 0 ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Clique em Mensagem para começar, ou arraste um bloco da paleta para o quadro.
        </p>
      ) : null}
    </div>
  );
}

export function FlowCanvasBoard(props: FlowCanvasBoardProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasBoardInner {...props} />
    </ReactFlowProvider>
  );
}
