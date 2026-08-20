'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Smile, Reply } from 'lucide-react';
import { Message } from '@/core/entities/Message';
import { QUICK_MESSAGE_REACTIONS, groupMessageReactions } from '@/core/entities/messageReaction';
import { EmojiCatalog } from '@/ui/components/emoji-catalog';
import { cn } from '@/ui/lib/utils';

type MessageReactionChipsProps = {
  message: Message;
  mineFrom: string;
  incoming: boolean;
  onReact: (emoji: string) => void;
};

export function MessageReactionChips({
  message,
  mineFrom,
  incoming,
  onReact,
}: MessageReactionChipsProps) {
  const chips = groupMessageReactions(message.reactions, mineFrom);
  if (chips.length === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        'absolute -bottom-2 z-10 flex flex-wrap gap-0.5',
        incoming ? 'left-1' : 'right-1'
      )}
    >
      {chips.map((chip) => (
        <button
          key={chip.emoji}
          type="button"
          className={cn(
            'rounded-full border bg-card px-1.5 py-0.5 text-[11px] leading-none shadow-sm',
            chip.mine ? 'border-primary' : 'border-border'
          )}
          onClick={() => onReact(chip.emoji)}
        >
          {chip.emoji}
          {chip.count > 1 ? ` ${chip.count}` : ''}
        </button>
      ))}
    </div>
  );
}

type MessageReactPickerProps = {
  incoming: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReact: (emoji: string) => void;
  onReply?: () => void;
};

export function MessageReactPicker({
  incoming,
  open,
  onOpenChange,
  onReact,
  onReply,
}: MessageReactPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setCatalogOpen(false);
      return;
    }
    const onDocument = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener('mousedown', onDocument);
    return () => document.removeEventListener('mousedown', onDocument);
  }, [open, onOpenChange]);

  const pick = (emoji: string) => {
    onReact(emoji);
    onOpenChange(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative shrink-0 self-center',
        open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
      )}
    >
      <button
        type="button"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted"
        aria-label="Reagir"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <Smile className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className={cn(
            'absolute z-20 mb-1 flex flex-col gap-1',
            'bottom-full',
            incoming ? 'left-0' : 'right-0'
          )}
        >
          {catalogOpen ? <EmojiCatalog onPick={pick} /> : null}
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full border border-border bg-card px-1 py-0.5 shadow-md',
              incoming ? 'self-start' : 'self-end'
            )}
          >
            {QUICK_MESSAGE_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded-full px-1.5 py-1 text-base leading-none hover:bg-muted"
                aria-label={`Reagir com ${emoji}`}
                onClick={() => pick(emoji)}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              aria-label="Responder"
              onClick={() => {
                onReply?.();
                onOpenChange(false);
              }}
            >
              <Reply className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                'inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted',
                catalogOpen ? 'bg-muted text-foreground' : ''
              )}
              aria-label="Mais reações"
              aria-expanded={catalogOpen}
              onClick={() => setCatalogOpen((value) => !value)}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
