'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Message } from '@/core/entities/Message';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { conversationDisplayName, formatInboxTime } from '@/core/entities/conversationInbox';
import { GetMessagesByContactUseCase } from '@/core/usecases/GetMessagesByContactUseCase';
import { GetFlowSessionUseCase } from '@/core/usecases/GetFlowSessionUseCase';
import { GetConversationByIdUseCase } from '@/core/usecases/GetConversationByIdUseCase';
import { MarkConversationReadUseCase } from '@/core/usecases/MarkConversationReadUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { AgentCatalogUseCase } from '@/core/usecases/AgentCatalogUseCase';
import { DepartmentCatalogUseCase } from '@/core/usecases/DepartmentCatalogUseCase';
import { ResumeContactFlowUseCase } from '@/core/usecases/ResumeContactFlowUseCase';
import { MessageMedia } from '@/ui/components/message-media';
import { MessageComposer } from '@/ui/components/message-composer';
import { ConversationActions } from '@/ui/components/conversation-actions';
import { TeamNotes } from '@/ui/components/team-notes';
import { MessageStatusTicks } from '@/ui/components/message-status-ticks';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Badge } from '@/ui/components/badge';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { queueToneOf } from '@/ui/lib/status-tone';

type MessageThreadProps = {
  contact: string;
  onBack?: () => void;
  onConversationChanged?: () => void;
};

export function MessageThread({ contact, onBack, onConversationChanged }: MessageThreadProps) {
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

  const load = async () => {
    await new MarkConversationReadUseCase().execute(contact);
    const [list, session, conv, agentList, departmentList, user] = await Promise.all([
      new GetMessagesByContactUseCase().execute(contact),
      new GetFlowSessionUseCase().execute(contact),
      new GetConversationByIdUseCase().execute(contact),
      new AgentCatalogUseCase().list(),
      new DepartmentCatalogUseCase().list(),
      new GetCurrentUserUseCase().execute(),
    ]);
    setMessages(list);
    setPaused(Boolean(session?.paused));
    setConversation(conv);
    setAgents(agentList);
    setDepartments(departmentList);
    setOperator(user);
  };

  const refresh = () => {
    void load().then(() => onConversationChanged?.());
  };

  useEffect(() => {
    load().catch((err) => console.error('Erro ao carregar conversa:', err));
    const timer = setInterval(() => {
      load().catch((err) => console.error('Erro ao atualizar conversa:', err));
    }, DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, [contact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingSend]);

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
              form.append('to', contact);
              form.append('message', input.text);
              form.append('file', input.file);
              return form;
            })(),
          })
        : await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: contact, message: input.text }),
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
      await new ResumeContactFlowUseCase().execute(contact);
      setPaused(false);
    } catch (err) {
      console.error('Erro ao retomar chatbot:', err);
      setError('Não foi possível retomar o chatbot');
    }
  };

  const title = conversation
    ? conversationDisplayName(conversation)
    : contact;
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
              <span>{contact}</span>
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
          contact={contact}
          conversation={conversation}
          agents={agents}
          departments={departments}
          operator={operator}
          onChanged={refresh}
        />
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
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border p-4">
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
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        incoming
                          ? 'bg-muted text-foreground'
                          : 'bg-accent text-accent-foreground'
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
                    </div>
                  </div>
                );
              })}
              {pendingSend ? (
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-accent px-3 py-2 text-accent-foreground">
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
