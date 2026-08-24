'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { dispatchDueSchedules } from '@/ui/lib/use-dispatch-due-schedules';
import { ScheduledMessage } from '@/core/entities/ScheduledMessage';
import { Contact } from '@/core/entities/Contact';
import { Conversation } from '@/core/entities/Conversation';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { scheduleOutgoingLineName } from '@/core/entities/scheduleOutgoingLine';
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
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { CatalogSaveButton } from '@/ui/components/catalog-save-button';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import {
  contactPickerLabel,
  findContactByPhone,
  normalizeSchedulePhone,
} from '@/ui/lib/contact-picker';
import { toLocalDatetimeValue } from '@/ui/lib/datetime-local';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';

const catalog = clientUseCases.scheduledMessages;
const contactsCatalog = clientUseCases.contacts;

function scheduleContactLabel(schedule: ScheduledMessage, contacts: Contact[]): string {
  const found = findContactByPhone(contacts, schedule.contact);
  return found ? contactPickerLabel(found) : schedule.contact;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduledMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduledMessage | null>(null);
  const [form, setForm] = useState({ contact: '', newName: '', message: '', scheduledDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  const { show, saving, kind, message, beginSave, markSaved, flashError } = useCatalogSavedFlash();

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [scheduleList, contactList, conversationList, numberList] = await Promise.all([
        catalog().list(),
        contactsCatalog().list(),
        clientUseCases.conversations().execute(false),
        listWhatsAppNumbersCached(),
      ]);
      setSchedules(scheduleList);
      setContacts(contactList);
      setConversations(conversationList);
      setNumbers(numberList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
    const timer = setInterval(() => void load(false), DASHBOARD_POLL_MS);
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
    beginSave();
    if (!findContactByPhone(contacts, phone)) {
      await clientUseCases.upsertContactFromIncoming().execute(phone, form.newName || undefined);
    }
    setError(null);
    try {
      await catalog().save({
        id: editing?.id || `schedule-${Date.now()}`,
        contact: phone,
        message: form.message,
        scheduledDate: new Date(form.scheduledDate),
        status: editing?.status || 'pending',
        createdAt: editing?.createdAt || new Date(),
        conversationId: editing?.conversationId,
      });
    } catch (cause) {
      setError(catalogPersistErrorMessage(cause, 'scheduled_messages'));
      flashError(catalogPersistErrorMessage(cause, 'scheduled_messages'));
      return;
    }
    try {
      await dispatchDueSchedules();
    } catch {
      // o cron tenta de novo se esta chamada falhar
    }
    reset();
    markSaved();
    load();
  };

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} kind={kind} message={message} />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
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
                <CatalogSaveButton flash={{ saving, show, kind, message }} disabled={!form.contact} />
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
          {loading ? (
            <CatalogListSkeleton />
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhuma mensagem agendada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Linha</TableHead>
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
                    <TableCell>
                      {scheduleOutgoingLineName(schedule, conversations, numbers)}
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
                                scheduledDate: toLocalDatetimeValue(new Date(schedule.scheduledDate)),
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
