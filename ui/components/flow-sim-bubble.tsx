import { flowStepMediaPreviewSrc } from '@/ui/lib/flow-step-media';
import { QuickReplyMediaPreview } from '@/ui/components/quick-reply-media-preview';
import { FlowStepMediaKind } from '@/core/entities/Flow';

type FlowSimBubbleProps = {
  direction: 'in' | 'out';
  text: string;
  flowId?: string;
  stepId?: string;
  mediaUrl?: string;
  mediaKind?: FlowStepMediaKind;
};

export function FlowSimBubble({
  direction,
  text,
  flowId,
  stepId,
  mediaUrl,
  mediaKind,
}: FlowSimBubbleProps) {
  const preview = flowStepMediaPreviewSrc(flowId, stepId ?? '', mediaUrl);
  const outgoing = direction === 'out';
  const kind = mediaKind ?? 'image';
  return (
    <div
      className={
        outgoing
          ? 'ml-8 space-y-2 whitespace-pre-wrap rounded-lg bg-bubble-out px-3 py-2 text-sm text-bubble-out-foreground shadow-sm'
          : 'mr-8 whitespace-pre-wrap rounded-lg bg-bubble-in px-3 py-2 text-sm text-bubble-in-foreground shadow-sm'
      }
    >
      {preview ? <QuickReplyMediaPreview src={preview} kind={kind} className="max-h-32" /> : null}
      {text ? <p>{text}</p> : null}
    </div>
  );
}
