'use client';

import { Tag } from '@/core/entities/Tag';
import { SetConversationTagsUseCase } from '@/core/usecases/SetConversationTagsUseCase';

type ConversationTagsControlProps = {
  conversationId: string;
  selected: string[];
  catalog: Tag[];
  onChanged: () => void;
};

export function ConversationTagsControl({
  conversationId,
  selected,
  catalog,
  onChanged,
}: ConversationTagsControlProps) {
  if (catalog.length === 0) {
    return null;
  }

  const toggle = async (name: string) => {
    const next = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
    await new SetConversationTagsUseCase().execute(conversationId, next);
    onChanged();
  };

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2">
      {catalog.map((tag) => {
        const on = selected.includes(tag.name);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => void toggle(tag.name)}
            className={`rounded-full border px-2 py-0.5 text-[11px] ${
              on ? 'border-transparent text-white' : 'border-border text-muted-foreground'
            }`}
            style={on ? { backgroundColor: tag.color } : undefined}
          >
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}
