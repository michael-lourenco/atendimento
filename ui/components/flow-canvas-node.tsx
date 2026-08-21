'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { flowCanvasNodeBorder } from '@/ui/lib/status-tone';

export type FlowCanvasNodeData = {
  title: string;
  hint: string;
  isStart: boolean;
  kind: string;
  warning: boolean;
  highlight?: boolean;
  handles: { id: string; label: string }[];
};

export type FlowCanvasRfNode = Node<FlowCanvasNodeData, 'flowStep'>;

export function FlowCanvasNode({ data, selected }: NodeProps<FlowCanvasRfNode>) {
  const border = flowCanvasNodeBorder[data.kind] ?? 'border-border';
  const multi = data.handles.length > 1;
  const ring = data.highlight
    ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background'
    : selected
      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      : '';

  return (
    <div
      className={`w-[240px] rounded-lg border-2 bg-card shadow-sm ${border} ${ring}`}
    >
      <Handle type="target" position={Position.Left} id="in" className="!h-3 !w-3 !bg-primary" />
      <div className="px-3 py-2">
        <div className="flex items-center gap-2">
          {data.isStart ? (
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              Início
            </span>
          ) : null}
          {data.warning ? (
            <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground">
              !
            </span>
          ) : null}
          <p className="truncate text-sm font-medium text-foreground">{data.title}</p>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{data.hint || 'Clique para editar'}</p>
      </div>
      {multi ? (
        <div className="border-t border-border py-1">
          {data.handles.map((handle) => (
            <div key={handle.id} className="relative flex h-6 items-center justify-end px-3">
              <span className="max-w-[180px] truncate text-[10px] text-muted-foreground">
                {handle.label}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={handle.id}
                className="!h-2.5 !w-2.5 !bg-primary"
              />
            </div>
          ))}
        </div>
      ) : data.handles[0] ? (
        <Handle
          type="source"
          position={Position.Right}
          id={data.handles[0].id}
          className="!h-3 !w-3 !bg-primary"
        />
      ) : null}
    </div>
  );
}
