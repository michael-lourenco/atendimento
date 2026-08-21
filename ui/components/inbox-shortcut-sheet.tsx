'use client';

import { Button } from '@/ui/components/button';
import { INBOX_SHORTCUT_ROWS } from '@/ui/lib/inbox-keyboard';

type InboxShortcutSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function InboxShortcutSheet({ open, onClose }: InboxShortcutSheetProps) {
  if (!open) {
    return null;
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inbox-shortcuts-title"
        className="w-full max-w-sm rounded-lg border border-border bg-card p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="inbox-shortcuts-title" className="text-sm font-medium text-foreground">
          Atalhos da fila
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {INBOX_SHORTCUT_ROWS.map((row) => (
            <li key={row.keys} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{row.label}</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
                {row.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
