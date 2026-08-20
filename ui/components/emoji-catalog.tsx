'use client';

import { useState } from 'react';
import { EMOJI_GROUPS, EmojiGroupId } from '@/ui/lib/emoji';
import { cn } from '@/ui/lib/utils';

type EmojiCatalogProps = {
  onPick: (emoji: string) => void;
};

export function EmojiCatalog({ onPick }: EmojiCatalogProps) {
  const [groupId, setGroupId] = useState<EmojiGroupId>('smileys');
  const group = EMOJI_GROUPS.find((item) => item.id === groupId) ?? EMOJI_GROUPS[0];

  return (
    <div
      className="w-[min(100vw-2rem,20rem)] rounded-md border border-border bg-card p-2 shadow-md"
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="mb-2 flex gap-1">
        {EMOJI_GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'rounded px-2 py-1 text-xs',
              item.id === groupId
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setGroupId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid max-h-40 grid-cols-8 gap-0.5 overflow-y-auto">
        {group.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded p-1 text-lg leading-none hover:bg-muted"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
