'use client';

import { useEffect, useState } from 'react';
import { ScheduledMessage } from '@/core/entities/ScheduledMessage';
import { ScheduledMessageCatalogUseCase } from '@/core/usecases/ScheduledMessageCatalogUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { Badge } from '@/ui/components/badge';
import { Plus } from 'lucide-react';

const catalog = () => new ScheduledMessageCatalogUseCase();

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduledMessage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduledMessage | null>(null);
  const [form, setForm] = useState({ contact: '', message: '', scheduledDate: '' });

  const load = async () => setSchedules(await catalog().list());

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ contact: '', message: '', scheduledDate: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await catalog().save({
      id: editing?.id || `schedule-${Date.now()}`,
      contact: form.contact,
      message: form.message,
      scheduledDate: new Date(form.scheduledDate),
      status: editing?.status || 'pending',
      createdAt: editing?.createdAt || new Date(),
    });
    reset();
    load();
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground mt-2">Agende o envio de mensagens para o futuro</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? 'Editar Agendamento' : 'Novo Agendamento'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Contato</Label>
                <Input
                  id="contact"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Data/hora</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
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
          <CardTitle>Mensagens Agendadas</CardTitle>
          <CardDescription>Visualize e gerencie suas mensagens agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma mensagem agendada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.contact}</TableCell>
                    <TableCell className="max-w-md truncate">{schedule.message}</TableCell>
                    <TableCell>{new Date(schedule.scheduledDate).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          schedule.status === 'sent'
                            ? 'default'
                            : schedule.status === 'pending'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {schedule.status === 'sent'
                          ? 'Enviada'
                          : schedule.status === 'pending'
                            ? 'Pendente'
                            : 'Falhou'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(schedule.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {schedule.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(schedule);
                              setForm({
                                contact: schedule.contact,
                                message: schedule.message,
                                scheduledDate: toLocalInput(new Date(schedule.scheduledDate)),
                              });
                              setShowForm(true);
                            }}
                          >
                            Editar
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            const label = schedule.status === 'pending' ? 'Cancelar' : 'Excluir';
                            if (confirm(`${label} este agendamento?`)) {
                              await catalog().delete(schedule.id);
                              load();
                            }
                          }}
                        >
                          {schedule.status === 'pending' ? 'Cancelar' : 'Excluir'}
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
