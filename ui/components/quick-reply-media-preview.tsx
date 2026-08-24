import { FileText } from 'lucide-react';
import { QuickReplyMediaKind } from '@/core/entities/QuickReply';
import { cn } from '@/ui/lib/utils';

type QuickReplyMediaPreviewProps = {
  src: string;
  kind: QuickReplyMediaKind;
  className?: string;
};

export function QuickReplyMediaPreview({ src, kind, className }: QuickReplyMediaPreviewProps) {
  if (kind === 'audio') {
    return <audio controls className={cn('w-full', className)} src={src} />;
  }
  if (kind === 'video') {
    return (
      <video controls className={cn('max-h-48 w-full rounded-md bg-black', className)} src={src} />
    );
  }
  if (kind === 'document') {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className={cn('inline-flex items-center gap-2 text-sm underline', className)}
      >
        <FileText className="h-4 w-4 shrink-0" aria-hidden />
        Abrir PDF
      </a>
    );
  }
  return <img alt="" className={cn('max-h-48 rounded-md object-contain', className)} src={src} />;
}
