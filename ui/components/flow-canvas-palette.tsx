'use client';

import { GripVertical } from 'lucide-react';
import { FlowAddKind } from '@/ui/lib/flow-step-graph';
import { cn } from '@/ui/lib/utils';
import { flowCanvasNodeBorder, flowPaletteChipFill } from '@/ui/lib/status-tone';

export const FLOW_KIND_MIME = 'application/x-chatbot-atimo-flow-kind';

export const FLOW_ADD_KINDS: { kind: FlowAddKind; label: string; hint: string }[] = [
  { kind: 'message', label: 'Mensagem', hint: 'Texto que o cliente recebe' },
  { kind: 'question', label: 'Pergunta', hint: 'Opções 1, 2, 3…' },
  { kind: 'action', label: 'Definir setor', hint: 'Manda a conversa para um setor' },
  { kind: 'goToFlow', label: 'Ir para fluxo', hint: 'Continua em outro roteiro' },
  { kind: 'handoff', label: 'Passar para atendente', hint: 'Pausa o bot para o time' },
];

type FlowCanvasPaletteProps = {
  onAdd: (kind: FlowAddKind) => void;
};

export function FlowCanvasPalette({ onAdd }: FlowCanvasPaletteProps) {
  return (
    <div className="rounded-md border border-border bg-muted/50 p-3">
      <p className="text-xs font-medium text-foreground">Blocos do roteiro</p>
      <p className="mb-2 text-xs text-muted-foreground">Arraste para o quadro ou clique</p>
      <div className="flex flex-wrap items-center gap-2">
        {FLOW_ADD_KINDS.map((item) => (
          <button
            key={item.kind}
            type="button"
            draggable
            title={item.hint}
            onDragStart={(event) => {
              event.dataTransfer.setData(FLOW_KIND_MIME, item.kind);
              event.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onAdd(item.kind)}
            className={cn(
              'inline-flex cursor-grab items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium shadow-sm hover:shadow-md active:cursor-grabbing',
              flowCanvasNodeBorder[item.kind],
              flowPaletteChipFill[item.kind]
            )}
          >
            <GripVertical className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
