'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { FormEvent, useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Conversation } from '@/core/entities/Conversation';
import { ScheduledMessage } from '@/core/entities/ScheduledMessage';
import { schedulesForConversation } from '@/core/entities/schedulesForConversation';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { CatalogSaveButton } from '@/ui/components/catalog-save-button';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { defaultScheduleDatetimeValue } from '@/ui/lib/datetime-local';
import { dispatchDueSchedules } from '@/ui/lib/use-dispatch-due-schedules';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';

const catalog = clientUseCases.scheduledMessages;

type ConversationSchedulePanelProps = {
  conversation: Conversation;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function ConversationSchedulePanel({
  conversation,
  open,
  onOpenChange,
  hideTrigger,
}: ConversationSchedulePanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (open === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };
  const [items, setItems] = useState<ScheduledMessage[]>([]);
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => defaultScheduleDatetimeValue());
  const [error, setError] = useState<string | null>(null);
  const { show, saving, kind, message: savedNotice, beginSave, markSaved, flashError } =
    useCatalogSavedFlash();
  const { confirm, dialog } = useConfirm();

  const load = async () => {
    const list = await catalog().list();
    setItems(schedulesForConversation(list, conversation));
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, [conversation.id, conversation.contactPhone]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !scheduledDate) {
      return;
    }
    beginSave();
    setError(null);
    try {
      await catalog().save({
        id: `schedule-${Date.now()}`,
        contact: conversation.contactPhone,
        message: text,
        scheduledDate: new Date(scheduledDate),
        status: 'pending',
        createdAt: new Date(),
        conversationId: conversation.id,
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
    setMessage('');
    setScheduledDate(defaultScheduleDatetimeValue());
    markSaved();
    await load();
  };

  const cancel = async (id: string) => {
    if (!(await confirm('Cancelar este agendamento?'))) {
      return;
    }
    await catalog().delete(id);
    await load();
  };

  return (
    <div className="space-y-2">
      {dialog}
      {!hideTrigger ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(!isOpen)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Agendar
        </Button>
      ) : null}
      {isOpen ? (
        <div className="space-y-3 rounded-md border border-border p-3">
          <CatalogSavedNotice show={show} kind={kind} message={savedNotice} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {hideTrigger ? (
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          ) : null}
          <form onSubmit={(event) => void save(event)} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="thread-schedule-when">Data/hora</Label>
              <Input
                id="thread-schedule-when"
                type="datetime-local"
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="thread-schedule-message">Mensagem</Label>
              <Textarea
                id="thread-schedule-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                required
                rows={3}
                className="bg-background"
              />
            </div>
            <CatalogSaveButton
              size="sm"
              flash={{ saving, show, kind, message: savedNotice }}
            >
              Agendar envio
            </CatalogSaveButton>
          </form>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum agendamento nesta conversa</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-border px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.message}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(item.scheduledDate).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge
                      variant={
                        item.status === 'sent'
                          ? 'success'
                          : item.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                      }
                    >
                      {item.status === 'sent'
                        ? 'Enviada'
                        : item.status === 'pending'
                          ? 'Pendente'
                          : 'Falhou'}
                    </Badge>
                    {item.status === 'pending' ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => void cancel(item.id)}>
                        Cancelar
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
