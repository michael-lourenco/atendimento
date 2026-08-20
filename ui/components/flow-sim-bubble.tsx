import { flowStepMediaPreviewSrc } from '@/ui/lib/flow-step-media';

type FlowSimBubbleProps = {
  direction: 'in' | 'out';
  text: string;
  flowId?: string;
  stepId?: string;
  mediaUrl?: string;
  mediaKind?: 'image' | 'audio';
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
  return (
    <div
      className={
        outgoing
          ? 'ml-8 space-y-2 whitespace-pre-wrap rounded-lg bg-bubble-out px-3 py-2 text-sm text-bubble-out-foreground shadow-sm'
          : 'mr-8 whitespace-pre-wrap rounded-lg bg-bubble-in px-3 py-2 text-sm text-bubble-in-foreground shadow-sm'
      }
    >
      {preview && mediaKind === 'audio' ? (
        <audio controls className="w-full" src={preview} />
      ) : null}
      {preview && mediaKind !== 'audio' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={text || 'Imagem'} className="max-h-32 rounded-md object-contain" src={preview} />
      ) : null}
      {text ? <p>{text}</p> : null}
    </div>
  );
}
