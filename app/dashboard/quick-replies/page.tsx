'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import {
  QuickReply,
  quickReplyHasMedia,
  quickReplyListPreview,
  quickReplyMediaLabel,
  sortQuickReplies,
} from '@/core/entities/QuickReply';
import { Department } from '@/core/entities/Department';
import { departmentNameOf } from '@/core/entities/conversationDepartment';
import { quickReplyMediaApiHref } from '@/core/services/IMediaStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { EmptyState } from '@/ui/components/empty-state';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { QuickReplyEditor } from '@/ui/components/quick-reply-editor';
import { QuickReplyMediaPreview } from '@/ui/components/quick-reply-media-preview';
import { Plus } from 'lucide-react';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';

const catalog = clientUseCases.quickReplies;

function sectorLabel(departments: Department[], departmentId?: string): string {
  if (!departmentId) {
    return 'Todos os setores';
  }
  return departmentNameOf(departments, departmentId) || 'Setor removido';
}

async function putMedia(id: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(quickReplyMediaApiHref(id), { method: 'PUT', body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível gravar a mídia');
  }
}

async function deleteMedia(id: string): Promise<void> {
  const response = await fetch(quickReplyMediaApiHref(id), { method: 'DELETE' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'Não foi possível remover a mídia');
  }
}

export default function QuickRepliesPage() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { confirm, dialog } = useConfirm();
  const { show, kind, message, markSaved, flashError } = useCatalogSavedFlash();

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [rows, depts] = await Promise.all([
        catalog().list(),
        clientUseCases.departments().list(),
      ]);
      setReplies(sortQuickReplies(rows));
      setDepartments(depts);
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
    departmentId?: string;
    file: File | null;
    removeMedia: boolean;
  }) => {
    const id = editing?.id || `qr-${Date.now()}`;
    try {
      await catalog().save({
        id,
        title: input.title,
        body: input.body,
        departmentId: input.departmentId,
        mediaKind: input.removeMedia ? undefined : editing?.mediaKind,
        createdAt: editing?.createdAt || new Date(),
      });
      if (input.removeMedia && !input.file) {
        await deleteMedia(id);
      }
      if (input.file) {
        await putMedia(id, input.file);
      }
      setError(null);
      reset();
      markSaved();
      await load();
    } catch (cause) {
      setError(catalogPersistErrorMessage(cause, 'quick_replies'));
      flashError(catalogPersistErrorMessage(cause, 'quick_replies'));
    }
  };

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} kind={kind} message={message} />
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground">Frases e mídias prontas para o chat</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova resposta
        </Button>
      </div>

      {showForm ? (
        <QuickReplyEditor
          key={editing?.id ?? 'new'}
          editing={editing}
          departments={departments}
          onCancel={reset}
          onSave={handleSave}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Respostas rápidas</CardTitle>
          <CardDescription>
            Texto insere no compositor; imagem, vídeo, áudio e PDF enviam na hora
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CatalogListSkeleton />
          ) : replies.length === 0 ? (
            <EmptyState
              title="Nenhuma resposta ainda"
              description="Cadastre uma frase, foto, vídeo, áudio ou PDF pronto para o atendimento."
              actionLabel="Nova resposta"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <span>{item.title}</span>
                      {item.mediaKind ? (
                        <Badge variant="info" className="ml-2">
                          {quickReplyMediaLabel(item.mediaKind)}
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sectorLabel(departments, item.departmentId)}
                    </TableCell>
                    <TableCell className="max-w-md">
                      {quickReplyHasMedia(item) && item.mediaKind ? (
                        <QuickReplyMediaPreview
                          className="mb-1 max-w-xs"
                          src={quickReplyMediaApiHref(item.id)}
                          kind={item.mediaKind}
                        />
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
