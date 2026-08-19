'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { Textarea } from '@/ui/components/textarea';
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
    <form onSubmit={onSubmit} className="space-y-2">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Mensagem. Enter envia, Shift+Enter quebra linha."
        rows={2}
        disabled={sending || disabled}
      />
      {file ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <Button type="button" variant="ghost" size="sm" onClick={clearFile} disabled={sending}>
            Remover
          </Button>
        </div>
      ) : null}
      {sizeError || error ? (
        <p className="text-sm text-destructive">{sizeError || error}</p>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            onChange={onFileChange}
            disabled={sending || disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || disabled}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Anexar
          </Button>
        </div>
        <Button type="submit" disabled={sending || disabled || (!draft.trim() && !file)}>
          {sending ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
}
