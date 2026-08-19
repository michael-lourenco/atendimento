'use client';

import { Clock, Check, CheckCheck, AlertCircle } from 'lucide-react';
import { Message } from '@/core/entities/Message';
import { WHATSAPP_TICK_LABEL, whatsappTickKind } from '@/core/entities/messageStatus';

type MessageStatusTicksProps = {
  message: Pick<Message, 'direction' | 'status'>;
};

export function MessageStatusTicks({ message }: MessageStatusTicksProps) {
  const kind = whatsappTickKind(message);
  if (!kind) return null;
  const label = WHATSAPP_TICK_LABEL[kind];
  const className = 'h-3.5 w-3.5 shrink-0';

  return (
    <span className="inline-flex" title={label} aria-label={label}>
      {kind === 'clock' ? <Clock className={className} /> : null}
      {kind === 'sent' ? <Check className={className} /> : null}
      {kind === 'delivered' ? <CheckCheck className={className} /> : null}
      {kind === 'read' ? <CheckCheck className={`${className} text-[#53bdeb]`} /> : null}
      {kind === 'failed' ? <AlertCircle className={`${className} text-red-500`} /> : null}
    </span>
  );
}
