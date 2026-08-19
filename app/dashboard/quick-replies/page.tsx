'use client';

import { useEffect, useState } from 'react';
import { QuickReply, sortQuickReplies } from '@/core/entities/QuickReply';
import { QuickReplyCatalogUseCase } from '@/core/usecases/QuickReplyCatalogUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { EmptyState } from '@/ui/components/empty-state';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { Plus } from 'lucide-react';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';

const catalog = () => new QuickReplyCatalogUseCase();

export default function QuickRepliesPage() {
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [form, setForm] = useState({ title: '', body: '' });
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
    setForm({ title: '', body: '' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await catalog().save({
        id: editing?.id || `qr-${Date.now()}`,
        title: form.title.trim(),
        body: form.body.trim(),
        createdAt: editing?.createdAt || new Date(),
      });
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
        <p className="text-muted-foreground">Frases prontas para inserir no chat</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova resposta
        </Button>
      </div>

      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? 'Editar resposta' : 'Nova resposta'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Saudação"
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Texto</Label>
                <Textarea
                  id="body"
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                  placeholder="Olá! Sou da equipe de atendimento. Como posso ajudar?"
                  required
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button type="button" variant="outline" onClick={reset}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Respostas rápidas</CardTitle>
          <CardDescription>Clique no compositor da conversa para inserir o texto</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CatalogListSkeleton />
          ) : replies.length === 0 ? (
            <EmptyState
              title="Nenhuma resposta ainda"
              description="Cadastre uma frase pronta para usar no atendimento."
              actionLabel="Nova resposta"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Texto</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {replies.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">{item.body}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(item);
                            setForm({ title: item.title, body: item.body });
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
