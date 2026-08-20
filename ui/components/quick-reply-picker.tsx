'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Mic, Zap } from 'lucide-react';
import {
  QuickReply,
  quickRepliesForConversation,
  quickRepliesMatchingQuery,
  quickReplyHasAudio,
  quickReplyListPreview,
  quickReplyPickerActionLabel,
  sortQuickReplies,
} from '@/core/entities/QuickReply';
import { fetchQuickReplyAudioFile } from '@/ui/lib/quick-reply-audio';
import { cn } from '@/ui/lib/utils';

export type QuickReplyPick = { text: string; file?: File };

type QuickReplyPickerProps = {
  disabled?: boolean;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  conversationDepartmentId?: string;
  onPick: (input: QuickReplyPick) => void | Promise<void>;
};

export function QuickReplyPicker({
  disabled,
  compact,
  open: openProp,
  onOpenChange,
  conversationDepartmentId,
  onPick,
}: QuickReplyPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [query, setQuery] = useState('');
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const open = openProp ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) {
      setUncontrolledOpen(next);
    }
    if (!next) {
      setQuery('');
      setPickError(null);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    void clientUseCases.quickReplies().list().then((rows) => setReplies(sortQuickReplies(rows)));
    requestAnimationFrame(() => filterRef.current?.focus());
  }, [open]);

  const scoped = quickRepliesForConversation(replies, conversationDepartmentId);
  const visible = quickRepliesMatchingQuery(scoped, query);

  const choose = async (item: QuickReply) => {
    if (pickingId) {
      return;
    }
    setPickError(null);
    setPickingId(item.id);
    try {
      if (quickReplyHasAudio(item)) {
        const file = await fetchQuickReplyAudioFile(item.id);
        if (!file) {
          setPickError('Não foi possível enviar o áudio');
          return;
        }
        try {
          await onPick({ text: item.body, file });
        } catch {
          setPickError('Não foi possível enviar o áudio');
          return;
        }
      } else {
        await onPick({ text: item.body });
      }
      setOpen(false);
    } finally {
      setPickingId(null);
    }
  };

  const onFilterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (visible[0]) {
        void choose(visible[0]);
      }
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    }
  };

  const onPanelMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, a')) {
      return;
    }
    event.preventDefault();
  };

  const emptyMessage =
    replies.length === 0
      ? null
      : scoped.length === 0
        ? 'Nenhuma resposta para este setor'
        : visible.length === 0
          ? 'Nenhuma resposta com esse filtro'
          : null;

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
        disabled={disabled || Boolean(pickingId)}
        onClick={() => setOpen(!open)}
      >
        {compact ? <Zap className="h-5 w-5" /> : 'Resposta'}
      </button>
      {open ? (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-[min(100vw-2rem,18rem)] rounded-md border border-border bg-card p-2 shadow-md"
          onMouseDown={onPanelMouseDown}
        >
          {replies.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Nenhuma resposta ainda.{' '}
              <Link href="/dashboard/quick-replies" className="underline">
                Gerenciar
              </Link>
            </p>
          ) : (
            <>
              <input
                ref={filterRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onFilterKeyDown}
                placeholder="Filtrar…"
                aria-label="Filtrar respostas rápidas"
                className="mb-2 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                disabled={Boolean(pickingId)}
              />
              {pickError ? <p className="mb-2 px-1 text-xs text-destructive">{pickError}</p> : null}
              {emptyMessage ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto">
                  {visible.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50"
                        disabled={Boolean(pickingId)}
                        aria-label={`${item.title}. ${quickReplyPickerActionLabel(item)}`}
                        onClick={() => void choose(item)}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground">{item.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {pickingId === item.id ? 'Enviando…' : quickReplyListPreview(item)}
                          </span>
                        </span>
                        {quickReplyHasAudio(item) ? (
                          <Mic className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
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
