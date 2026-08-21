'use client';

import { KeyboardEvent, ClipboardEvent, useState } from 'react';
import { Badge } from '@/ui/components/badge';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { addFlowKeywords, popFlowKeyword, removeFlowKeyword } from '@/ui/lib/flow-keywords';

type FlowKeywordChipsProps = {
  value: string[];
  onChange: (next: string[]) => void;
  onShortcutSave?: (keywords: string[]) => void;
  label?: string;
  inputId?: string;
  placeholder?: string;
  hint?: string;
};

export function FlowKeywordChips({
  value,
  onChange,
  onShortcutSave,
  label = 'Palavras-chave',
  inputId = 'flow-keywords',
  placeholder,
  hint = 'Enter ou vírgula adiciona. Se o cliente enviar isso, entra neste fluxo (precisa estar Ativo).',
}: FlowKeywordChipsProps) {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const next = addFlowKeywords(value, raw);
    setDraft('');
    if (next !== value) {
      onChange(next);
    }
    return next;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      event.stopPropagation();
      onShortcutSave?.(commit(draft));
      return;
    }
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === 'Backspace' && !draft && value.length > 0) {
      event.preventDefault();
      onChange(popFlowKeyword(value));
    }
  };

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!text.trim()) {
      return;
    }
    event.preventDefault();
    commit(`${draft}${text}`);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-2 py-2">
        {value.map((keyword, index) => (
          <Badge key={`${keyword}-${index}`} variant="secondary" className="gap-1 pr-1">
            <span>{keyword}</span>
            <button
              type="button"
              className="rounded-full px-1 text-xs leading-none hover:bg-muted"
              aria-label={`Remover ${keyword}`}
              onClick={() => onChange(removeFlowKeyword(value, index))}
            >
              ×
            </button>
          </Badge>
        ))}
        <Input
          id={inputId}
          value={draft}
          placeholder={placeholder ?? (value.length === 0 ? 'preço' : 'Outra palavra')}
          className="h-8 min-w-[8rem] flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => {
            if (draft.trim()) {
              commit(draft);
            }
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
