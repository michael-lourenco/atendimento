'use client';

import { ChangeEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { Message } from '@/core/entities/Message';
import { Button } from '@/ui/components/button';
import { Textarea } from '@/ui/components/textarea';
import { EmojiPicker } from '@/ui/components/emoji-picker';
import { QuickReplyPicker } from '@/ui/components/quick-reply-picker';
import { PttButton } from '@/ui/components/ptt-button';
import { insertEmojiAtCursor } from '@/ui/lib/emoji';
import { MAX_OUTGOING_MEDIA_BYTES } from '@/core/services/IMediaStorage';
import { PTT_MAX_MS } from '@/ui/lib/ptt-file';
import { usePttRecorder } from '@/ui/lib/use-ptt-recorder';
import { ComposerPresence, postComposerPresence } from '@/ui/lib/composer-presence';
import { isQuickReplyPickerOpenKey } from '@/ui/lib/quick-reply-picker-keys';

type MessageComposerProps = {
  disabled?: boolean;
  sending: boolean;
  error: string | null;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  presenceTo?: string;
  conversationId?: string;
  conversationDepartmentId?: string;
  onSend: (input: { text: string; file: File | null; quotedMessageId?: string }) => Promise<void>;
};

export function MessageComposer({
  disabled,
  sending,
  error,
  replyTo,
  onCancelReply,
  presenceTo,
  conversationId,
  conversationDepartmentId,
  onSend,
}: MessageComposerProps) {
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [pttCancelArmed, setPttCancelArmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lastPresence = useRef('');
  const finishingPtt = useRef(false);
  const ptt = usePttRecorder();
  const busy = sending || disabled;
  const canSend = Boolean(draft.trim() || file) && !busy;
  const showMic = ptt.supported && !draft.trim() && !file && !busy;

  const sendPresence = (presence: ComposerPresence) => {
    if (!presenceTo || (busy && presence !== 'paused') || lastPresence.current === presence) {
      return;
    }
    lastPresence.current = presence;
    postComposerPresence(presenceTo, conversationId, presence);
  };

  useEffect(() => {
    if (!presenceTo || busy || ptt.recording) {
      return;
    }
    if (!draft.trim()) {
      sendPresence('paused');
      return;
    }
    const timer = setTimeout(() => sendPresence('composing'), 400);
    return () => clearTimeout(timer);
  }, [draft, presenceTo, busy, conversationId, ptt.recording]);

  useEffect(
    () => () => {
      lastPresence.current = '';
      postComposerPresence(presenceTo, conversationId, 'paused');
      ptt.cancel();
    },
    [presenceTo, conversationId]
  );

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      await onSend({ text, file, quotedMessageId: replyTo?.id });
      setDraft('');
      clearFile();
      setSizeError(null);
      sendPresence('paused');
    } catch {
      return;
    }
  };

  const finishPtt = async (sendIt: boolean) => {
    if (finishingPtt.current) {
      return;
    }
    finishingPtt.current = true;
    setPttCancelArmed(false);
    sendPresence('paused');
    try {
      const audio = sendIt ? await ptt.stop() : (ptt.cancel(), null);
      if (!audio || audio.size === 0) {
        return;
      }
      if (audio.size > MAX_OUTGOING_MEDIA_BYTES) {
        setSizeError('Arquivo maior que 16 MB');
        return;
      }
      await onSend({ text: '', file: audio, quotedMessageId: replyTo?.id });
    } catch {
      setSizeError('Não foi possível enviar o áudio');
    } finally {
      finishingPtt.current = false;
    }
  };

  const startPtt = async () => {
    setSizeError(null);
    try {
      const started = await ptt.start();
      if (started) {
        lastPresence.current = '';
        sendPresence('recording');
      }
    } catch {
      setSizeError('Microfone indisponível');
    }
  };

  useEffect(() => {
    if (ptt.recording && ptt.elapsedMs >= PTT_MAX_MS) {
      void finishPtt(true);
    }
  }, [ptt.recording, ptt.elapsedMs]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isQuickReplyPickerOpenKey(event, draft)) {
      event.preventDefault();
      setQuickOpen(true);
      return;
    }
    if (event.key === 'Escape' && quickOpen) {
      event.preventDefault();
      setQuickOpen(false);
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
    if (event.key === 'Escape' && replyTo) {
      event.preventDefault();
      onCancelReply?.();
    }
    if (event.key === 'Escape' && ptt.recording) {
      event.preventDefault();
      void finishPtt(false);
    }
  };

  const seconds = Math.max(1, Math.ceil(ptt.elapsedMs / 1000));
  const pttHint = pttCancelArmed
    ? 'Solte para cancelar'
    : `Gravando… ${seconds}s · solte para enviar · deslize para cima para cancelar`;

  return (
    <form
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        void submit();
      }}
      className="bg-muted"
    >
      {replyTo ? (
        <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
          <div className="min-w-0 border-l-2 border-primary pl-2">
            <p className="text-[11px] font-medium text-primary">Respondendo a</p>
            <p className="truncate text-xs text-muted-foreground">{replyTo.content}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onCancelReply} aria-label="Cancelar resposta">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
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
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const selected = event.target.files?.[0] ?? null;
            if (selected && selected.size > MAX_OUTGOING_MEDIA_BYTES) {
              setSizeError('Arquivo maior que 16 MB');
              return;
            }
            setSizeError(null);
            setFile(selected);
          }}
          disabled={busy || ptt.recording}
        />
        <EmojiPicker compact disabled={busy || ptt.recording} onPick={insertText} />
        <QuickReplyPicker
          compact
          open={quickOpen}
          onOpenChange={setQuickOpen}
          conversationDepartmentId={conversationDepartmentId}
          disabled={busy || ptt.recording}
          onPick={async ({ text, file: audio }) => {
            if (audio) {
              await onSend({ text, file: audio, quotedMessageId: replyTo?.id });
              return;
            }
            insertText(text);
          }}
        />
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-background disabled:opacity-50"
          aria-label="Anexar"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy || ptt.recording}
        >
          <Paperclip className="h-5 w-5" />
        </button>
        {ptt.recording ? (
          <p className="min-h-10 flex-1 px-4 py-2.5 text-sm text-destructive">{pttHint}</p>
        ) : (
          <Textarea
            ref={textRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Mensagem"
            title="Enter envia. Shift+Enter quebra a linha. / abre respostas rápidas."
            rows={1}
            disabled={busy}
            className="min-h-10 max-h-24 flex-1 resize-none rounded-3xl border-0 bg-card px-4 py-2.5 shadow-sm focus-visible:ring-1"
          />
        )}
        {showMic || ptt.recording ? (
          <PttButton
            recording={ptt.recording}
            disabled={Boolean(busy && !ptt.recording)}
            onHoldStart={() => void startPtt()}
            onHoldEnd={() => void finishPtt(true)}
            onHoldCancel={() => void finishPtt(false)}
            onSlideCancelChange={setPttCancelArmed}
          />
        ) : (
          <button
            type="submit"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40"
            aria-label={sending ? 'Enviando' : 'Enviar'}
            disabled={!canSend}
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}
