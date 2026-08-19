'use client';

import { useEffect, useState } from 'react';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { dispatchDueSchedules } from '@/ui/lib/use-dispatch-due-schedules';
import { ScheduledMessage } from '@/core/entities/ScheduledMessage';
import { Contact } from '@/core/entities/Contact';
import { ScheduledMessageCatalogUseCase } from '@/core/usecases/ScheduledMessageCatalogUseCase';
import { ContactCatalogUseCase } from '@/core/usecases/ContactCatalogUseCase';
import { UpsertContactFromIncomingUseCase } from '@/core/usecases/UpsertContactFromIncomingUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { Badge } from '@/ui/components/badge';
import { ContactPicker } from '@/ui/components/contact-picker';
import { Plus } from 'lucide-react';
import { useConfirm } from '@/ui/components/confirm-dialog';
import {
  contactPickerLabel,
  findContactByPhone,
  normalizeSchedulePhone,
} from '@/ui/lib/contact-picker';

const catalog = () => new ScheduledMessageCatalogUseCase();
const contactsCatalog = () => new ContactCatalogUseCase();

function toLocalInput(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function scheduleContactLabel(schedule: ScheduledMessage, contacts: Contact[]): string {
  const found = findContactByPhone(contacts, schedule.contact);
  return found ? contactPickerLabel(found) : schedule.contact;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduledMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduledMessage | null>(null);
  const [form, setForm] = useState({ contact: '', newName: '', message: '', scheduledDate: '' });
  const { confirm, dialog } = useConfirm();

  const load = async () => {
    const [scheduleList, contactList] = await Promise.all([
      catalog().list(),
      contactsCatalog().list(),
    ]);
    setSchedules(scheduleList);
    setContacts(contactList);
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const reset = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ contact: '', newName: '', message: '', scheduledDate: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizeSchedulePhone(form.contact);
    if (!phone) return;
    if (!findContactByPhone(contacts, phone)) {
      await new UpsertContactFromIncomingUseCase().execute(phone, form.newName || undefined);
    }
    await catalog().save({
      id: editing?.id || `schedule-${Date.now()}`,
      contact: phone,
      message: form.message,
      scheduledDate: new Date(form.scheduledDate),
      status: editing?.status || 'pending',
      createdAt: editing?.createdAt || new Date(),
    });
    try {
      await dispatchDueSchedules();
    } catch {
      // o cron tenta de novo se esta chamada falhar
    }
    reset();
    load();
  };

  return (
    <div>
      {dialog}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-muted-foreground">Envio na hora marcada, mesmo com o painel fechado</p>
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
                <ContactPicker
                  contacts={contacts}
                  value={form.contact}
                  onChange={(contact) =>
                    setForm((current) => ({ ...current, contact, newName: '' }))
                  }
                  newName={form.newName}
                  onNewNameChange={(newName) =>
                    setForm((current) => ({ ...current, newName }))
                  }
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
                <Button type="submit" disabled={!form.contact}>
                  Salvar
                </Button>
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
          <CardDescription>
            Pendente até a hora chegar; Enviada ou Falhou depois do disparo
          </CardDescription>
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
                    <TableCell className="font-medium">
                      {scheduleContactLabel(schedule, contacts)}
                    </TableCell>
                    <TableCell className="max-w-md truncate">{schedule.message}</TableCell>
                    <TableCell>{new Date(schedule.scheduledDate).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          schedule.status === 'sent'
                            ? 'success'
                            : schedule.status === 'pending'
                              ? 'warning'
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
                                newName: '',
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
                            if (!(await confirm(`${label} este agendamento?`))) return;
                            await catalog().delete(schedule.id);
                            load();
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
