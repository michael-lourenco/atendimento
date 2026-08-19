'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { Paperclip, Send } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Textarea } from '@/ui/components/textarea';
import { EmojiPicker } from '@/ui/components/emoji-picker';
import { QuickReplyPicker } from '@/ui/components/quick-reply-picker';
import { insertEmojiAtCursor } from '@/ui/lib/emoji';
import { MAX_OUTGOING_MEDIA_BYTES } from '@/core/services/IMediaStorage';

type MessageComposerProps = {
  disabled?: boolean;
  sending: boolean;
  error: string | null;
  onSend: (input: { text: string; file: File | null }) => Promise<void>;
};

export function MessageComposer({ disabled, sending, error, onSend }: MessageComposerProps) {
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const busy = sending || disabled;
  const canSend = Boolean(draft.trim() || file) && !busy;

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_OUTGOING_MEDIA_BYTES) {
      setSizeError('Arquivo maior que 16 MB');
      return;
    }
    setSizeError(null);
    setFile(selected);
  };

  const insertText = (piece: string) => {
    const area = textRef.current;
    const start = area?.selectionStart ?? draft.length;
    const end = area?.selectionEnd ?? draft.length;
    const next = insertEmojiAtCursor(draft, piece, start, end);
    setDraft(next.text);
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(next.cursor, next.cursor);
    });
  };

  const submit = async () => {
    const text = draft.trim();
    if ((!text && !file) || sending || disabled) {
      return;
    }
    try {
      await onSend({ text, file });
      setDraft('');
      clearFile();
      setSizeError(null);
    } catch {
      return;
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="bg-muted">
      {file ? (
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={sending}>
            Remover
          </Button>
        </div>
      ) : null}
      {sizeError || error ? (
        <p className="px-3 pt-2 text-sm text-destructive">{sizeError || error}</p>
      ) : null}
      <div className="flex items-end gap-1.5 px-2 py-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          onChange={onFileChange}
          disabled={busy}
        />
        <EmojiPicker compact disabled={busy} onPick={insertText} />
        <QuickReplyPicker compact disabled={busy} onPick={insertText} />
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background disabled:opacity-50"
          aria-label="Anexar"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <Textarea
          ref={textRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Mensagem"
          title="Enter envia. Shift+Enter quebra a linha."
          rows={1}
          disabled={busy}
          className="min-h-10 max-h-24 flex-1 resize-none rounded-3xl border-0 bg-card px-4 py-2.5 shadow-sm focus-visible:ring-1"
        />
        <button
          type="submit"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40"
          aria-label={sending ? 'Enviando' : 'Enviar'}
          disabled={!canSend}
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
