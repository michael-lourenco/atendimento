'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { QuickReply, sortQuickReplies } from '@/core/entities/QuickReply';
import { QuickReplyCatalogUseCase } from '@/core/usecases/QuickReplyCatalogUseCase';
import { cn } from '@/ui/lib/utils';

type QuickReplyPickerProps = {
  disabled?: boolean;
  compact?: boolean;
  onPick: (body: string) => void;
};

export function QuickReplyPicker({ disabled, compact, onPick }: QuickReplyPickerProps) {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<QuickReply[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void new QuickReplyCatalogUseCase().list().then((rows) => setReplies(sortQuickReplies(rows)));
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          compact
            ? 'inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-background disabled:opacity-50'
            : 'inline-flex h-9 items-center rounded-md border border-input bg-background px-2.5 text-sm hover:bg-accent disabled:opacity-50'
        )}
        aria-label="Resposta rápida"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        {compact ? <Zap className="h-5 w-5" /> : 'Resposta'}
      </button>
      {open ? (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-[min(100vw-2rem,18rem)] rounded-md border border-border bg-card p-2 shadow-md"
          onMouseDown={(event) => event.preventDefault()}
        >
          {replies.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Nenhuma resposta ainda.{' '}
              <Link href="/dashboard/quick-replies" className="underline">
                Gerenciar
              </Link>
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {replies.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1.5 text-left hover:bg-muted"
                    onClick={() => {
                      onPick(item.body);
                      setOpen(false);
                    }}
                  >
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/quick-replies"
            className="mt-2 block px-2 pt-2 text-xs text-muted-foreground underline"
          >
            Gerenciar
          </Link>
        </div>
      ) : null}
    </div>
  );
}
