'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WhatsAppNumber, WhatsAppNumberStatus } from '@/core/entities/WhatsAppNumber';
import {
  isLiveWhatsAppNumber,
  mergeWhatsAppNumbersWithLive,
} from '@/core/entities/whatsappNumberLive';
import { WhatsAppNumberCatalogUseCase } from '@/core/usecases/WhatsAppNumberCatalogUseCase';
import { SyncLiveWhatsAppNumberUseCase } from '@/core/usecases/SyncLiveWhatsAppNumberUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button, buttonVariants } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Badge } from '@/ui/components/badge';
import { Plus } from 'lucide-react';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { useWhatsAppStatus } from '@/ui/lib/use-whatsapp-status';
import { cn } from '@/ui/lib/utils';

const catalog = () => new WhatsAppNumberCatalogUseCase();

export default function NumbersPage() {
  const [saved, setSaved] = useState<WhatsAppNumber[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WhatsAppNumber | null>(null);
  const [form, setForm] = useState({
    name: '',
    number: '',
    provider: 'WhatsApp Business API',
    status: 'active' as WhatsAppNumberStatus,
  });
  const { confirm, dialog } = useConfirm();
  const { connected, pushname, wid, platform } = useWhatsAppStatus();
  const numbers = mergeWhatsAppNumbersWithLive(saved, {
    connected: connected === true,
    wid,
    pushname,
    platform,
  });

  const load = async () => setSaved(await catalog().list());

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (connected !== true) return;
    let cancelled = false;
    const persist = async () => {
      try {
        await new SyncLiveWhatsAppNumberUseCase().execute({
          connected: true,
          wid,
          pushname,
          platform,
        });
      } catch {
        // lista ainda mostra a sessão ao vivo mesmo se o catálogo falhar
      }
      if (!cancelled) {
        await load();
      }
    };
    void persist();
    return () => {
      cancelled = true;
    };
  }, [connected, wid, pushname, platform]);

  const reset = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', number: '', provider: 'WhatsApp Business API', status: 'active' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await catalog().save({
      id: editing?.id || `number-${Date.now()}`,
      name: form.name,
      number: form.number,
      provider: form.provider,
      status: form.status,
      createdAt: editing?.createdAt || new Date(),
    });
    reset();
    load();
  };

  return (
    <div>
      {dialog}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-muted-foreground">Números do WhatsApp conectados</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Número
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? 'Editar Número' : 'Novo Número'}</CardTitle>
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
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provedor</Label>
                <Input
                  id="provider"
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  required
                  className="bg-background"
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Números Conectados</CardTitle>
          <CardDescription>Visualize e gerencie seus números do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {connected === null && saved.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Carregando conexão...</div>
          ) : numbers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <p>Nenhum número conectado. Escaneie o QR do WhatsApp para aparecer aqui.</p>
              <Link href="/dashboard/whatsapp" className={cn(buttonVariants())}>
                Conectar WhatsApp
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Conexão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((num) => (
                  <TableRow key={num.id}>
                    <TableCell className="font-medium">{num.name}</TableCell>
                    <TableCell>{num.number}</TableCell>
                    <TableCell>
                      <Badge variant={num.status === 'active' ? 'success' : 'muted'}>
                        {num.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{num.provider}</TableCell>
                    <TableCell>
                      {isLiveWhatsAppNumber(num.id)
                        ? 'Sessão atual'
                        : new Date(num.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isLiveWhatsAppNumber(num.id) ? (
                          <Link
                            href="/dashboard/whatsapp"
                            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          >
                            Gerenciar conexão
                          </Link>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditing(num);
                                setForm({
                                  name: num.name,
                                  number: num.number,
                                  provider: num.provider,
                                  status: num.status,
                                });
                                setShowForm(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!(await confirm('Remover este número do catálogo?'))) return;
                                await catalog().delete(num.id);
                                load();
                              }}
                            >
                              Remover
                            </Button>
                          </>
                        )}
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
