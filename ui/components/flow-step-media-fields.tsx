'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { FlowStep } from '@/core/entities/Flow';
import {
  flowStepMediaApiHref,
  flowStepMediaPath,
  flowStepStoragePathFromRef,
  mediaKindFromMime,
} from '@/core/services/IMediaStorage';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { PttButton } from '@/ui/components/ptt-button';
import { flowSelectClass } from '@/ui/components/flow-next-step-select';
import { PTT_MAX_MS } from '@/ui/lib/ptt-file';
import { usePttRecorder } from '@/ui/lib/use-ptt-recorder';
import { flowStepMediaFileError, flowStepMediaPreviewSrc } from '@/ui/lib/flow-step-media';

type FlowStepMediaFieldsProps = {
  flowId?: string;
  canAttach: boolean;
  step: FlowStep;
  onPatch: (next: FlowStep) => void;
  onEnsureSaved?: () => Promise<string | null>;
  onPersisted?: (flowId: string) => void;
};

async function sendStepMedia(
  flowId: string,
  stepId: string,
  file: File | null
): Promise<Response> {
  const href = flowStepMediaApiHref(flowId, stepId);
  if (!file) {
    return fetch(href, { method: 'DELETE' });
  }
  const form = new FormData();
  form.set('file', file);
  return fetch(href, { method: 'PUT', body: form });
}

export function FlowStepMediaFields({
  flowId,
  canAttach,
  step,
  onPatch,
  onEnsureSaved,
  onPersisted,
}: FlowStepMediaFieldsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pttCancelArmed, setPttCancelArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const finishingPtt = useRef(false);
  const ptt = usePttRecorder();
  const preview = flowStepMediaPreviewSrc(flowId, step.id, step.mediaUrl);
  const stored = Boolean(flowStepStoragePathFromRef(step.mediaUrl ?? ''));
  const urlValue = stored ? '' : (step.mediaUrl ?? '');
  const previewKind = step.mediaKind === 'audio' ? 'audio' : 'image';

  useEffect(() => () => ptt.cancel(), []);

  const applyUpload = async (file: File | null) => {
    if (file) {
      const problem = flowStepMediaFileError(file);
      if (problem) {
        setError(problem);
        return;
      }
    } else if (!canAttach && !flowStepStoragePathFromRef(step.mediaUrl ?? '')) {
      onPatch({ ...step, mediaUrl: undefined, mediaKind: undefined });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let id = canAttach && flowId ? flowId : undefined;
      if (!id) {
        id = (await onEnsureSaved?.()) ?? undefined;
      }
      if (!id) {
        return;
      }
      const response = await sendStepMedia(id, step.id, file);
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error || 'Não foi possível gravar a mídia');
        onPersisted?.(id);
        return;
      }
      if (!file) {
        onPatch({ ...step, mediaUrl: undefined, mediaKind: undefined });
        onPersisted?.(id);
        return;
      }
      const mediaKind = mediaKindFromMime(file.type || 'application/octet-stream');
      onPatch({
        ...step,
        mediaUrl: flowStepMediaPath(id, step.id),
        mediaKind: mediaKind === 'audio' ? 'audio' : 'image',
      });
      onPersisted?.(id);
    } catch {
      setError('Não foi possível gravar a mídia');
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    if (selected) {
      void applyUpload(selected);
    }
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const finishPtt = async (keep: boolean) => {
    if (finishingPtt.current) {
      return;
    }
    finishingPtt.current = true;
    setPttCancelArmed(false);
    try {
      const audio = keep ? await ptt.stop() : (ptt.cancel(), null);
      if (audio) {
        void applyUpload(audio);
      }
    } catch {
      setError('Microfone indisponível');
    } finally {
      finishingPtt.current = false;
    }
  };

  useEffect(() => {
    if (ptt.recording && ptt.elapsedMs >= PTT_MAX_MS) {
      void finishPtt(true);
    }
  }, [ptt.recording, ptt.elapsedMs]);

  const seconds = Math.max(1, Math.ceil(ptt.elapsedMs / 1000));

  return (
    <div className="space-y-2">
      {preview ? (
        previewKind === 'audio' ? (
          <audio controls className="w-full" src={preview} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Mídia do passo"
            className="max-h-32 rounded-md border border-border object-contain"
            src={preview}
          />
        )
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
          {ptt.supported ? (
            <PttButton
              recording={ptt.recording}
              disabled={busy}
              recordingLabel="Solte para usar o áudio"
              onHoldStart={() => {
                setError(null);
                void ptt.start().catch(() => setError('Microfone indisponível'));
              }}
              onHoldEnd={() => void finishPtt(true)}
              onHoldCancel={() => void finishPtt(false)}
              onSlideCancelChange={setPttCancelArmed}
            />
          ) : null}
          <Input
            ref={fileRef}
            type="file"
            accept="image/*,audio/*"
            className="bg-background"
            disabled={busy || ptt.recording}
            onChange={onFileChange}
          />
        </div>
      {ptt.recording ? (
        <p className="text-sm text-destructive">
          {pttCancelArmed
            ? 'Solte para cancelar'
            : `Gravando… ${seconds}s · solte para usar · deslize para cima para cancelar`}
        </p>
      ) : null}
      {step.mediaUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy || ptt.recording}
          onClick={() => {
            void applyUpload(null);
          }}
        >
          Remover
        </Button>
      ) : null}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">URL (opcional)</Label>
        <Input
          value={urlValue}
          placeholder="https://…"
          disabled={busy}
          onChange={(event) => {
            const mediaUrl = event.target.value.trim();
            if (!mediaUrl) {
              if (stored) {
                return;
              }
              onPatch({ ...step, mediaUrl: undefined, mediaKind: undefined });
              return;
            }
            onPatch({ ...step, mediaUrl, mediaKind: step.mediaKind ?? 'image' });
          }}
        />
        {!stored ? (
          <select
            className={flowSelectClass}
            value={step.mediaKind ?? 'image'}
            aria-label="Tipo da mídia"
            onChange={(event) =>
              onPatch({ ...step, mediaKind: event.target.value as 'image' | 'audio' })
            }
          >
            <option value="image">Imagem</option>
            <option value="audio">Áudio</option>
          </select>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">Imagem ou áudio. Máx. 16 MB.</p>
    </div>
  );
}
