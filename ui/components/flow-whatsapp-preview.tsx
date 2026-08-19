import { Flow, FlowStep } from '@/core/entities/Flow';
import { previewFlowOpening } from '@/core/engine/previewFlowOpening';

type FlowWhatsAppPreviewProps = {
  steps: FlowStep[];
  flows?: Flow[];
};

export function FlowWhatsAppPreview({ steps, flows = [] }: FlowWhatsAppPreviewProps) {
  const replies = previewFlowOpening(steps, new Date(0), flows);
  return (
    <div className="space-y-2 rounded-md border border-border bg-chat p-3">
      <p className="text-xs font-medium text-muted-foreground">Como o cliente vê (primeiro oi)</p>
      {replies.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Adicione uma mensagem ou pergunta para ver a prévia.
        </p>
      ) : (
        <div className="space-y-2">
          {replies.map((text, index) => (
            <div
              key={`${index}-${text.slice(0, 24)}`}
              className="ml-8 whitespace-pre-wrap rounded-lg bg-bubble-out px-3 py-2 text-sm text-bubble-out-foreground shadow-sm"
            >
              {text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
