import { FlowStep } from '@/core/entities/Flow';
import { previewFlowOpening } from '@/core/engine/previewFlowOpening';

type FlowWhatsAppPreviewProps = {
  steps: FlowStep[];
};

export function FlowWhatsAppPreview({ steps }: FlowWhatsAppPreviewProps) {
  const replies = previewFlowOpening(steps);
  return (
    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
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
              className="ml-8 whitespace-pre-wrap rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
            >
              {text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
