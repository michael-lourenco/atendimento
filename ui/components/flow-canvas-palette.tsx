'use client';

import { Button } from '@/ui/components/button';
import { FlowAddKind } from '@/ui/lib/flow-step-graph';

export const FLOW_KIND_MIME = 'application/x-chatbot-atimo-flow-kind';

export const FLOW_ADD_KINDS: { kind: FlowAddKind; label: string; hint: string }[] = [
  { kind: 'message', label: 'Mensagem', hint: 'Texto que o cliente recebe' },
  { kind: 'question', label: 'Pergunta', hint: 'Opções 1, 2, 3…' },
  { kind: 'action', label: 'Definir setor', hint: 'Manda a conversa para um setor' },
  { kind: 'goToFlow', label: 'Ir para fluxo', hint: 'Continua em outro roteiro' },
];

type FlowCanvasPaletteProps = {
  onAdd: (kind: FlowAddKind) => void;
};

export function FlowCanvasPalette({ onAdd }: FlowCanvasPaletteProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Arraste para o quadro ou clique</span>
      {FLOW_ADD_KINDS.map((item) => (
        <Button
          key={item.kind}
          type="button"
          variant="outline"
          size="sm"
          draggable
          title={item.hint}
          onDragStart={(event) => {
            event.dataTransfer.setData(FLOW_KIND_MIME, item.kind);
            event.dataTransfer.effectAllowed = 'move';
          }}
          onClick={() => onAdd(item.kind)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
