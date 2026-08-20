'use client';

import { useState } from 'react';
import { Smile } from 'lucide-react';
import { EmojiCatalog } from '@/ui/components/emoji-catalog';
import { cn } from '@/ui/lib/utils';

type EmojiPickerProps = {
  disabled?: boolean;
  compact?: boolean;
  onPick: (emoji: string) => void;
};

export function EmojiPicker({ disabled, compact, onPick }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          compact
            ? 'inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-background disabled:opacity-50'
            : 'inline-flex h-9 items-center rounded-md border border-input bg-background px-2.5 text-lg leading-none hover:bg-accent disabled:opacity-50'
        )}
        aria-label="Inserir emoji"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        {compact ? <Smile className="h-5 w-5" /> : '😊'}
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 mb-2">
          <EmojiCatalog
            onPick={(emoji) => {
              onPick(emoji);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
