import { Flow, FlowStep } from '@/core/entities/Flow';
import { previewFlowOpening } from '@/core/engine/previewFlowOpening';
import { FlowSimBubble } from '@/ui/components/flow-sim-bubble';

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
          {replies.map((reply, index) => (
            <FlowSimBubble
              key={`${index}-${reply.stepId}`}
              direction="out"
              text={reply.content}
              flowId={reply.flowId}
              stepId={reply.stepId}
              mediaUrl={reply.mediaUrl}
              mediaKind={reply.mediaKind}
            />
          ))}
        </div>
      )}
    </div>
  );
}
