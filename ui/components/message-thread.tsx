'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Message } from '@/core/entities/Message';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { User } from '@/core/entities/User';
import { GetMessagesByContactUseCase } from '@/core/usecases/GetMessagesByContactUseCase';
import { GetFlowSessionUseCase } from '@/core/usecases/GetFlowSessionUseCase';
import { GetConversationByIdUseCase } from '@/core/usecases/GetConversationByIdUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { AgentCatalogUseCase } from '@/core/usecases/AgentCatalogUseCase';
import { ResumeContactFlowUseCase } from '@/core/usecases/ResumeContactFlowUseCase';
import { MessageMedia } from '@/ui/components/message-media';
import { ConversationActions } from '@/ui/components/conversation-actions';
import { Button } from '@/ui/components/button';
import { Textarea } from '@/ui/components/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { ScrollArea } from '@/ui/components/scroll-area';

type MessageThreadProps = {
  contact: string;
};

export function MessageThread({ contact }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [paused, setPaused] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [operator, setOperator] = useState<User | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [list, session, conv, agentList, user] = await Promise.all([
      new GetMessagesByContactUseCase().execute(contact),
      new GetFlowSessionUseCase().execute(contact),
      new GetConversationByIdUseCase().execute(contact),
      new AgentCatalogUseCase().list(),
      new GetCurrentUserUseCase().execute(),
    ]);
    setMessages(list);
    setPaused(Boolean(session?.paused));
    setConversation(conv);
    setAgents(agentList);
    setOperator(user);
  };

  useEffect(() => {
    load().catch((err) => console.error('Erro ao carregar conversa:', err));
    const timer = setInterval(() => {
      load().catch((err) => console.error('Erro ao atualizar conversa:', err));
    }, 8000);
    return () => clearInterval(timer);
  }, [contact]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contact, message: text }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || body.error || 'Falha ao enviar');
      }
      setDraft('');
      setPaused(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar');
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

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Conversa</CardTitle>
            <CardDescription>
              {contact}
              {conversation?.status === 'closed' ? ' · finalizada' : ''}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ConversationActions
              contact={contact}
              conversation={conversation}
              agents={agents}
              operator={operator}
              onChanged={() => void load()}
            />
            {paused ? (
              <div className="flex items-center gap-2">
                <span className="rounded border border-yellow-500/30 bg-yellow-500/20 px-2 py-1 text-xs text-yellow-700 dark:text-yellow-400">
                  Chatbot pausado
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => void resume()}>
                  Retomar chatbot
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[480px] rounded-md border border-border p-4">
          {messages.length === 0 ? (
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
                      className={`max-w-[75%] rounded-lg p-3 ${
                        incoming
                          ? 'bg-muted text-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <MessageMedia
                        id={message.id}
                        type={message.type}
                        content={message.content}
                      />
                      <p className="mt-1 text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <form onSubmit={onSubmit} className="space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escreva uma mensagem. Enter envia, Shift+Enter quebra linha."
            rows={3}
            disabled={sending}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={sending || !draft.trim()}>
              {sending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
