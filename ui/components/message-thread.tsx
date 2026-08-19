'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Message } from '@/core/entities/Message';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { conversationDisplayName, formatInboxTime } from '@/core/entities/conversationInbox';
import { GetMessagesByContactUseCase } from '@/core/usecases/GetMessagesByContactUseCase';
import { GetFlowSessionUseCase } from '@/core/usecases/GetFlowSessionUseCase';
import { GetConversationByIdUseCase } from '@/core/usecases/GetConversationByIdUseCase';
import { MarkConversationReadUseCase } from '@/core/usecases/MarkConversationReadUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { AgentCatalogUseCase } from '@/core/usecases/AgentCatalogUseCase';
import { DepartmentCatalogUseCase } from '@/core/usecases/DepartmentCatalogUseCase';
import { ResumeContactFlowUseCase } from '@/core/usecases/ResumeContactFlowUseCase';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { MessageMedia } from '@/ui/components/message-media';
import { MessageComposer } from '@/ui/components/message-composer';
import { ConversationActions } from '@/ui/components/conversation-actions';
import { ConversationSchedulePanel } from '@/ui/components/conversation-schedule-panel';
import { TeamNotes } from '@/ui/components/team-notes';
import { MessageStatusTicks } from '@/ui/components/message-status-ticks';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { queueToneOf } from '@/ui/lib/status-tone';

type MessageThreadProps = {
  conversationId: string;
  onBack?: () => void;
  onConversationChanged?: () => void;
};

export function MessageThread({ conversationId, onBack, onConversationChanged }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [paused, setPaused] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [operator, setOperator] = useState<User | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingSend, setPendingSend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lineRef = useRef<WhatsAppNumber | null>(null);

  const load = async (refreshCatalogs: boolean) => {
    try {
      await new MarkConversationReadUseCase().execute(conversationId);
    } catch {
      // zerar não lidas não pode esconder o chat
    }
    const conv = await new GetConversationByIdUseCase().execute(conversationId);
    if (refreshCatalogs) {
      const [agentList, departmentList, user, numberList] = await Promise.all([
        new AgentCatalogUseCase().list(),
        new DepartmentCatalogUseCase().list(),
        new GetCurrentUserUseCase().execute(),
        listWhatsAppNumbersCached(),
      ]);
      lineRef.current = numberList.find((item) => item.id === conv?.whatsappNumberId) ?? null;
      setAgents(agentList);
      setDepartments(departmentList);
      setOperator(user);
    } else if (conv?.whatsappNumberId && lineRef.current?.id !== conv.whatsappNumberId) {
      const numberList = await listWhatsAppNumbersCached();
      lineRef.current = numberList.find((item) => item.id === conv.whatsappNumberId) ?? null;
    }
    const phone = conv?.contactPhone ?? conversationId;
    const [list, session] = await Promise.all([
      new GetMessagesByContactUseCase().execute(phone, lineRef.current),
      new GetFlowSessionUseCase().execute(conversationId),
    ]);
    setMessages(list);
    setPaused(Boolean(session?.paused));
    setConversation(conv);
  };

  const refresh = () => {
    void load(false).then(() => onConversationChanged?.());
  };

  useEffect(() => {
    lineRef.current = null;
    load(true).catch((err) => console.error('Erro ao carregar conversa:', err));
    const timer = setInterval(() => {
      load(false).catch((err) => console.error('Erro ao atualizar conversa:', err));
    }, DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingSend]);

  const phone = conversation?.contactPhone ?? conversationId;

  const send = async (input: { text: string; file: File | null }) => {
    setSending(true);
    setError(null);
    setPendingSend(input.text.trim() || (input.file ? input.file.name : '…'));
    try {
      const response = input.file
        ? await fetch('/api/messages/send', {
            method: 'POST',
            body: (() => {
              const form = new FormData();
              form.append('to', phone);
              form.append('conversationId', conversationId);
              form.append('message', input.text);
              form.append('file', input.file);
              return form;
            })(),
          })
        : await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: phone, message: input.text, conversationId }),
          });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || body.error || 'Falha ao enviar');
      }
      setPaused(true);
      setPendingSend(null);
      refresh();
    } catch (err) {
      setPendingSend(null);
      setError(err instanceof Error ? err.message : 'Falha ao enviar');
      throw err;
    } finally {
      setSending(false);
    }
  };

  const resume = async () => {
    try {
      await new ResumeContactFlowUseCase().execute(conversationId);
      setPaused(false);
    } catch (err) {
      console.error('Erro ao retomar chatbot:', err);
      setError('Não foi possível retomar o chatbot');
    }
  };

  const title = conversation
    ? conversationDisplayName(conversation)
    : phone;
  const queueTone = conversation ? queueToneOf(conversation) : null;

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <CardHeader className="shrink-0 space-y-3">
        <div className="flex items-start gap-2">
          {onBack ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onBack}
              aria-label="Voltar à lista"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <span>{phone}</span>
              {queueTone ? (
                <Badge
                  variant={
                    queueTone === 'incoming' ? 'warning' : queueTone === 'waiting' ? 'info' : 'muted'
                  }
                >
                  {queueTone === 'incoming'
                    ? 'Entrada'
                    : queueTone === 'waiting'
                      ? 'Em atendimento'
                      : 'Finalizada'}
                </Badge>
              ) : null}
            </CardDescription>
          </div>
        </div>
        <ConversationActions
          conversation={conversation}
          agents={agents}
          departments={departments}
          operator={operator}
          onChanged={refresh}
        />
        {conversation ? <ConversationSchedulePanel conversation={conversation} /> : null}
        {paused ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-xs text-amber-800 dark:text-amber-300">
              Chatbot pausado
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void resume()}>
              Retomar chatbot
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col space-y-3">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border bg-chat p-4">
          {messages.length === 0 && !pendingSend ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem neste contato
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const incoming = message.direction === 'incoming';
                return (
                  <div
                    key={message.id}
                    className={`flex ${incoming ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                        incoming
                          ? 'bg-bubble-in text-bubble-in-foreground'
                          : 'bg-bubble-out text-bubble-out-foreground'
                      }`}
                    >
                      <MessageMedia
                        id={message.id}
                        type={message.type}
                        content={message.content}
                      />
                      <p className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
                        <span>{formatInboxTime(message.timestamp)}</span>
                        <MessageStatusTicks message={message} />
                      </p>
                      {!incoming && message.status === 'failed' ? (
                        <button
                          type="button"
                          className="mt-1 text-[11px] underline opacity-80"
                          onClick={() => void send({ text: message.content, file: null })}
                        >
                          Reenviar
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {pendingSend ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-bubble-out px-3 py-2 text-bubble-out-foreground shadow-sm">
                    <p className="whitespace-pre-wrap break-words text-sm">{pendingSend}</p>
                    <p className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
                      <span>agora</span>
                      <MessageStatusTicks message={{ direction: 'outgoing', status: 'pending' }} />
                    </p>
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
        {conversation ? <TeamNotes conversationId={conversation.id} operator={operator} /> : null}
        <MessageComposer
          sending={sending}
          error={error}
          disabled={conversation?.status === 'closed'}
          onSend={send}
        />
      </CardContent>
    </Card>
  );
}
