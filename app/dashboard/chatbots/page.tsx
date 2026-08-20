'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { Chatbot } from '@/core/entities/Chatbot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import {
  BusinessHoursFields,
  DEFAULT_BUSINESS_HOURS,
} from '@/ui/components/business-hours-fields';

const catalog = clientUseCases.chatbots;

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Chatbot | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    hours: DEFAULT_BUSINESS_HOURS,
  });
  const { confirm, dialog } = useConfirm();
  const { show, markSaved } = useCatalogSavedFlash();

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      setChatbots(await catalog().list());
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
    setForm({ name: '', description: '', isActive: true, hours: DEFAULT_BUSINESS_HOURS });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    await catalog().save({
      id: editing?.id || `bot-${Date.now()}`,
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      flowId: editing?.flowId,
      messagesCount: editing?.messagesCount || 0,
      businessHours: form.hours,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    });
    reset();
    markSaved();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Excluir este chatbot?'))) return;
    await catalog().delete(id);
    load();
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <p className="text-muted-foreground">O roteiro do atendimento é o fluxo.</p>
        </div>
        <CatalogListSkeleton />
      </div>
    );
  }

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          O roteiro do atendimento é o fluxo.{' '}
          <Link href="/dashboard/flows" className="underline">
            Abrir Fluxos
          </Link>
        </p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Chatbot
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? 'Editar Chatbot' : 'Novo Chatbot'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-background"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Ativo
              </label>
              <BusinessHoursFields
                value={form.hours}
                onChange={(hours) => setForm({ ...form, hours })}
              />
              <div className="flex gap-2">
                <Button type="submit">Salvar</Button>
                <Button type="button" variant="outline" onClick={reset}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Chatbots</CardTitle>
          <CardDescription>Visualize e gerencie seus chatbots</CardDescription>
        </CardHeader>
        <CardContent>
          {chatbots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum chatbot encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatbots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>{bot.description}</TableCell>
                    <TableCell>
                      <Badge variant={bot.isActive ? 'success' : 'muted'}>
                        {bot.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{bot.messagesCount}</TableCell>
                    <TableCell>{new Date(bot.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(bot);
                            setForm({
                              name: bot.name,
                              description: bot.description || '',
                              isActive: bot.isActive,
                              hours: bot.businessHours ?? DEFAULT_BUSINESS_HOURS,
                            });
                            setShowForm(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(bot.id)}>
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
