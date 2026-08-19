'use client';

import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ConversationAvatar } from '@/ui/components/conversation-avatar';
import { queueToneOf } from '@/ui/lib/status-tone';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';

type ConversationThreadHeaderProps = {
  title: string;
  phone: string;
  lineName?: string;
  photoUrl?: string;
  queueTone: ReturnType<typeof queueToneOf> | null;
  onBack?: () => void;
  children?: ReactNode;
};

export function ConversationThreadHeader({
  title,
  phone,
  lineName,
  photoUrl,
  queueTone,
  onBack,
  children,
}: ConversationThreadHeaderProps) {
  const subtitle = [phone, lineName].filter(Boolean).join(' · ');

  return (
    <div className="shrink-0 border-b border-border bg-muted px-3 py-2">
      <div className="flex items-center gap-3">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onBack}
            aria-label="Voltar à lista"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}
        <ConversationAvatar name={title} photoUrl={photoUrl} className="bg-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium leading-tight text-foreground">{title}</p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{subtitle}</span>
            {queueTone ? (
              <Badge
                variant={
                  queueTone === 'incoming' ? 'warning' : queueTone === 'waiting' ? 'info' : 'muted'
                }
              >
                {queueTone === 'incoming'
                  ? 'Entrada'
                  : queueTone === 'waiting'
                    ? 'Em atendimento'
                    : 'Finalizada'}
              </Badge>
            ) : null}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
