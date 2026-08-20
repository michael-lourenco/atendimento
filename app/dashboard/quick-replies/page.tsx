'use client';

import { useEffect, useState } from 'react';
import {
  QuickReply,
  quickReplyHasAudio,
  quickReplyListPreview,
  sortQuickReplies,
} from '@/core/entities/QuickReply';
import { quickReplyMediaApiHref } from '@/core/services/IMediaStorage';
import { QuickReplyCatalogUseCase } from '@/core/usecases/QuickReplyCatalogUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { EmptyState } from '@/ui/components/empty-state';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { QuickReplyEditor } from '@/ui/components/quick-reply-editor';
import { Plus } from 'lucide-react';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';

const catalog = () => new QuickReplyCatalogUseCase();

async function putAudio(id: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(quickReplyMediaApiHref(id), { method: 'PUT', body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível gravar o áudio');
  }
}

async function deleteAudio(id: string): Promise<void> {
  const response = await fetch(quickReplyMediaApiHref(id), { method: 'DELETE' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível remover o áudio');
  }
}

export default function QuickRepliesPage() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { confirm, dialog } = useConfirm();
  const { show, markSaved } = useCatalogSavedFlash();

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      setReplies(sortQuickReplies(await catalog().list()));
      setError(null);
    } catch (cause) {
      setError(catalogPersistErrorMessage(cause, 'quick_replies'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
  }, []);

  const reset = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSave = async (input: {
    title: string;
    body: string;
    file: File | null;
    removeAudio: boolean;
  }) => {
    const id = editing?.id || `qr-${Date.now()}`;
    try {
      await catalog().save({
        id,
        title: input.title,
        body: input.body,
        mediaKind: input.removeAudio ? undefined : editing?.mediaKind,
        createdAt: editing?.createdAt || new Date(),
      });
      if (input.removeAudio && !input.file) {
        await deleteAudio(id);
      }
      if (input.file) {
        await putAudio(id, input.file);
      }
      setError(null);
      reset();
      markSaved();
      await load();
    } catch (cause) {
      setError(catalogPersistErrorMessage(cause, 'quick_replies'));
    }
  };

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} />
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">Frases e áudios prontos para o chat</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova resposta
        </Button>
      </div>

      {showForm ? (
        <QuickReplyEditor
          key={editing?.id ?? 'new'}
          editing={editing}
          onCancel={reset}
          onSave={handleSave}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Respostas rápidas</CardTitle>
          <CardDescription>Texto insere no compositor; áudio envia na hora</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CatalogListSkeleton />
          ) : replies.length === 0 ? (
            <EmptyState
              title="Nenhuma resposta ainda"
              description="Cadastre uma frase ou um áudio pronto para o atendimento."
              actionLabel="Nova resposta"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <span>{item.title}</span>
                      {quickReplyHasAudio(item) ? (
                        <Badge variant="info" className="ml-2">
                          Áudio
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-md">
                      {quickReplyHasAudio(item) ? (
                        <audio controls className="mb-1 w-full max-w-xs" src={quickReplyMediaApiHref(item.id)} />
                      ) : null}
                      <p className="truncate text-muted-foreground">{quickReplyListPreview(item)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(item);
                            setShowForm(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!(await confirm('Excluir esta resposta?'))) return;
                            try {
                              await catalog().delete(item.id);
                              await load();
                            } catch (cause) {
                              setError(catalogPersistErrorMessage(cause, 'quick_replies'));
                            }
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
