'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { FormEvent, useEffect, useState } from 'react';
import { InternalMessage } from '@/core/entities/InternalMessage';
import { User } from '@/core/entities/User';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { formatInboxTime } from '@/core/entities/conversationInbox';

type TeamNotesProps = {
  conversationId: string;
  operator: User | null;
  onCount?: (count: number) => void;
};

export function TeamNotes({ conversationId, operator, onCount }: TeamNotesProps) {
  const [notes, setNotes] = useState<InternalMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const next = await clientUseCases.internalMessages().execute(conversationId);
    setNotes(next);
    onCount?.(next.length);
  };

  useEffect(() => {
    void load().catch(() => undefined);
  }, [conversationId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !operator || saving) {
      return;
    }
    setSaving(true);
    try {
      await clientUseCases.saveInternalMessage().execute({
        id: `note-${Date.now()}`,
        from: operator.id,
        fromName: operator.name,
        conversationId,
        content,
        type: 'note',
        timestamp: new Date(),
      });
      setDraft('');
      await load();
    } catch {
      /* keep notes */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="font-medium text-foreground">Notas da equipe</span>
        <span className="text-xs text-muted-foreground">
          {notes.length} {open ? '· ocultar' : '· ver'}
        </span>
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border p-3">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma nota neste atendimento.</p>
          ) : (
            <ul className="max-h-36 space-y-2 overflow-y-auto">
              {notes.map((note) => (
                <li key={note.id} className="text-sm">
                  <p className="text-foreground">{note.content}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {note.fromName} · {formatInboxTime(note.timestamp)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {operator ? (
            <form onSubmit={(event) => void submit(event)} className="flex gap-2">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Nota só para a equipe"
                className="bg-background"
              />
              <Button type="submit" size="sm" disabled={saving || !draft.trim()}>
                Anotar
              </Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">Entre para anotar.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
