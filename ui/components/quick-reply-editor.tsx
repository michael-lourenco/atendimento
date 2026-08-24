'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  QuickReply,
  isQuickReplyMediaKind,
  quickReplyHasMedia,
  quickReplyIsValid,
} from '@/core/entities/QuickReply';
import { mediaKindFromMime, quickReplyMediaApiHref } from '@/core/services/IMediaStorage';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { PttButton } from '@/ui/components/ptt-button';
import { QuickReplyMediaPreview } from '@/ui/components/quick-reply-media-preview';
import { PTT_MAX_MS } from '@/ui/lib/ptt-file';
import { usePttRecorder } from '@/ui/lib/use-ptt-recorder';
import { mimeOfFile, quickReplyMediaFileError } from '@/ui/lib/quick-reply-audio';

type QuickReplyEditorProps = {
  editing: QuickReply | null;
  departments: { id: string; name: string; isActive: boolean }[];
  onCancel: () => void;
  onSave: (input: {
    title: string;
    body: string;
    departmentId?: string;
    file: File | null;
    removeMedia: boolean;
  }) => Promise<void>;
};

function mediaKindOfFile(file: File) {
  const mime = mimeOfFile(file);
  if (!mime) {
    return undefined;
  }
  const kind = mediaKindFromMime(mime);
  return isQuickReplyMediaKind(kind) ? kind : undefined;
}

export function QuickReplyEditor({ editing, departments, onCancel, onSave }: QuickReplyEditorProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [departmentId, setDepartmentId] = useState(editing?.departmentId ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [pttCancelArmed, setPttCancelArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const finishingPtt = useRef(false);
  const ptt = usePttRecorder();
  const keepMedia = Boolean(editing && quickReplyHasMedia(editing) && !removeMedia && !file);
  const draftKind = file ? mediaKindOfFile(file) : keepMedia ? editing?.mediaKind : undefined;
  const draft: QuickReply = {
    id: editing?.id ?? 'new',
    title,
    body,
    mediaKind: draftKind,
    createdAt: editing?.createdAt ?? new Date(),
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => () => ptt.cancel(), []);

  const applyFile = (selected: File | null) => {
    if (selected) {
      const problem = quickReplyMediaFileError(selected);
      if (problem) {
        setSizeError(problem);
        return;
      }
      setSizeError(null);
      setRemoveMedia(false);
      setFile(selected);
      return;
    }
    setSizeError(null);
    setFile(null);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    applyFile(event.target.files?.[0] ?? null);
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
        applyFile(audio);
      }
    } catch {
      setSizeError('Microfone indisponível');
    } finally {
      finishingPtt.current = false;
    }
  };

  useEffect(() => {
    if (ptt.recording && ptt.elapsedMs >= PTT_MAX_MS) {
      void finishPtt(true);
    }
  }, [ptt.recording, ptt.elapsedMs]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (ptt.recording || !quickReplyIsValid(draft) || sizeError) {
      return;
    }
    await onSave({
      title: title.trim(),
      body: body.trim(),
      departmentId: departmentId || undefined,
      file,
      removeMedia,
    });
  };

  const seconds = Math.max(1, Math.ceil(ptt.elapsedMs / 1000));
  const mediaSrc = previewUrl ?? (keepMedia && editing ? quickReplyMediaApiHref(editing.id) : null);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editing ? 'Editar resposta' : 'Nova resposta'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Saudação"
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Setor</Label>
            <select
              id="department"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            >
              <option value="">Todos os setores</option>
              {departments
                .filter((item) => item.isActive || item.id === departmentId)
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Texto</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Olá! Sou da equipe de atendimento. Como posso ajudar?"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="media">Mídia</Label>
            {mediaSrc && draftKind ? (
              <QuickReplyMediaPreview src={mediaSrc} kind={draftKind} />
            ) : null}
            <div className="flex items-center gap-2">
              {ptt.supported ? (
                <PttButton
                  recording={ptt.recording}
                  recordingLabel="Solte para usar o áudio"
                  onHoldStart={() => {
                    setSizeError(null);
                    void ptt.start().catch(() => setSizeError('Microfone indisponível'));
                  }}
                  onHoldEnd={() => void finishPtt(true)}
                  onHoldCancel={() => void finishPtt(false)}
                  onSlideCancelChange={setPttCancelArmed}
                />
              ) : null}
              <Input
                id="media"
                ref={fileRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,application/pdf"
                className="bg-background"
                disabled={ptt.recording}
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
            {file && !ptt.recording ? (
              <p className="text-sm text-muted-foreground">{file.name}</p>
            ) : null}
            {keepMedia || file ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={ptt.recording}
                onClick={() => {
                  applyFile(null);
                  setRemoveMedia(true);
                  if (fileRef.current) {
                    fileRef.current.value = '';
                  }
                }}
              >
                Remover mídia
              </Button>
            ) : null}
            {sizeError ? <p className="text-sm text-destructive">{sizeError}</p> : null}
            <p className="text-xs text-muted-foreground">
              Foto, vídeo, áudio ou PDF. Grave no microfone ou envie um arquivo. Texto, mídia ou os
              dois. Máx. 16 MB.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={ptt.recording || !quickReplyIsValid(draft) || Boolean(sizeError)}
            >
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={ptt.recording}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
