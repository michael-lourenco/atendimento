'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '@/core/entities/Message';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { Tag } from '@/core/entities/Tag';
import { User } from '@/core/entities/User';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { conversationDisplayName, conversationPhotoUrl, conversationIsTyping } from '@/core/entities/conversationInbox';
import { GetMessagesByContactUseCase } from '@/core/usecases/GetMessagesByContactUseCase';
import { GetFlowSessionUseCase } from '@/core/usecases/GetFlowSessionUseCase';
import { GetConversationByIdUseCase } from '@/core/usecases/GetConversationByIdUseCase';
import { MarkConversationReadUseCase } from '@/core/usecases/MarkConversationReadUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { AgentCatalogUseCase } from '@/core/usecases/AgentCatalogUseCase';
import { DepartmentCatalogUseCase } from '@/core/usecases/DepartmentCatalogUseCase';
import { TagCatalogUseCase } from '@/core/usecases/TagCatalogUseCase';
import { ResumeContactFlowUseCase } from '@/core/usecases/ResumeContactFlowUseCase';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { MessageComposer } from '@/ui/components/message-composer';
import { ConversationActions } from '@/ui/components/conversation-actions';
import { ConversationSchedulePanel } from '@/ui/components/conversation-schedule-panel';
import { ConversationThreadHeader } from '@/ui/components/conversation-thread-header';
import { ConversationTagsControl } from '@/ui/components/conversation-tags-control';
import { TeamNotes } from '@/ui/components/team-notes';
import { Card, CardContent } from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { ChatThreadSkeleton } from '@/ui/components/chat-thread-skeleton';
import { ChatMessageList } from '@/ui/components/chat-message-list';
import { conversationThreadBody } from '@/ui/lib/conversation-thread-body';
import { messagesMatchingQuery } from '@/ui/lib/messages-matching-query';
import { coalesceMessageList, nextMessageReactions } from '@/core/entities/messageReaction';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { useInboxRealtime } from '@/ui/lib/use-inbox-realtime';
import { queueToneOf } from '@/ui/lib/status-tone';
import { postThreadMessage } from '@/ui/lib/post-thread-message';

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
  const [tags, setTags] = useState<Tag[]>([]);
  const [operator, setOperator] = useState<User | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingSend, setPendingSend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messagesReady, setMessagesReady] = useState(false);
  const [lineName, setLineName] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const lineRef = useRef<WhatsAppNumber | null>(null);

  const load = async (refreshCatalogs: boolean, isCancelled: () => boolean = () => false) => {
    try {
      await new MarkConversationReadUseCase().execute(conversationId);
    } catch {
      // zerar não lidas não pode esconder o chat
    }
    if (isCancelled()) return;
    const conv = await new GetConversationByIdUseCase().execute(conversationId);
    if (isCancelled()) return;
    if (refreshCatalogs) {
      const [agentList, departmentList, user, numberList, tagList] = await Promise.all([
        new AgentCatalogUseCase().list(),
        new DepartmentCatalogUseCase().list(),
        new GetCurrentUserUseCase().execute(),
        listWhatsAppNumbersCached(),
        new TagCatalogUseCase().list(),
      ]);
      if (isCancelled()) return;
      lineRef.current = numberList.find((item) => item.id === conv?.whatsappNumberId) ?? null;
      setLineName(lineRef.current?.name ?? '');
      setAgents(agentList);
      setDepartments(departmentList);
      setTags(tagList);
      setOperator(user);
    } else if (conv?.whatsappNumberId && lineRef.current?.id !== conv.whatsappNumberId) {
      const numberList = await listWhatsAppNumbersCached();
      if (isCancelled()) return;
      lineRef.current = numberList.find((item) => item.id === conv.whatsappNumberId) ?? null;
      setLineName(lineRef.current?.name ?? '');
    }
    const phone = conv?.contactPhone ?? conversationId;
    const [list, session] = await Promise.all([
      new GetMessagesByContactUseCase().execute(phone, lineRef.current),
      new GetFlowSessionUseCase().execute(conversationId),
    ]);
    if (isCancelled()) return;
    setMessages((prev) => coalesceMessageList(list, prev));
    setPaused(Boolean(session?.paused));
    setConversation(conv);
  };

  const refresh = () => {
    void load(false).then(() => onConversationChanged?.());
  };

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    lineRef.current = null;
    setLineName('');
    setScheduleOpen(false);
    setMessages([]);
    setPendingSend(null);
    setMessagesReady(false);
    setSearch('');
    void load(true, isCancelled)
      .catch((err) => {
        if (!cancelled) {
          console.error('Erro ao carregar conversa:', err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMessagesReady(true);
        }
      });
    const timer = setInterval(() => {
      load(false, isCancelled).catch((err) => console.error('Erro ao atualizar conversa:', err));
    }, DASHBOARD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversationId]);

  useInboxRealtime(() => {
    void load(false);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, pendingSend]);

  const phone = conversation?.contactPhone ?? conversationId;

  const send = async (input: { text: string; file: File | null; quotedMessageId?: string }) => {
    setSending(true);
    setError(null);
    setPendingSend(input.text.trim() || (input.file ? input.file.name : '…'));
    try {
      await postThreadMessage({
        to: phone,
        conversationId,
        text: input.text,
        file: input.file,
        quotedMessageId: input.quotedMessageId,
      });
      setPaused(true);
      setPendingSend(null);
      setReplyTo(null);
      refresh();
    } catch (err) {
      setPendingSend(null);
      setError(err instanceof Error ? err.message : 'Falha ao enviar');
      throw err;
    } finally {
      setSending(false);
    }
  };

  const react = async (messageId: string, emoji: string) => {
    const current = messages.find((item) => item.id === messageId);
    if (!current) {
      return;
    }
    const optimistic = { ...current, reactions: nextMessageReactions(current, emoji) };
    setMessages((prev) => prev.map((item) => (item.id === messageId ? optimistic : item)));
    try {
      const response = await fetch('/api/messages/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || 'Falha ao reagir');
      }
      if (Array.isArray(body.reactions)) {
        setMessages((prev) =>
          prev.map((item) => (item.id === messageId ? { ...item, reactions: body.reactions } : item))
        );
      }
      refresh();
    } catch (err) {
      setMessages((prev) => prev.map((item) => (item.id === messageId ? current : item)));
      setError(err instanceof Error ? err.message : 'Falha ao reagir');
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

  const threadBody = conversationThreadBody({
    ready: messagesReady,
    messageCount: messages.length,
    hasPending: Boolean(pendingSend),
  });
  const visibleMessages = messagesMatchingQuery(messages, search);
  const title = conversation ? conversationDisplayName(conversation) : phone;
  const queueTone = conversation ? queueToneOf(conversation) : null;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <ConversationThreadHeader
        title={title}
        phone={phone}
        lineName={lineName || undefined}
        photoUrl={conversation ? conversationPhotoUrl(conversation) : undefined}
        typing={conversation ? conversationIsTyping(conversation) : false}
        queueTone={queueTone}
        onBack={onBack}
      >
        <ConversationActions
          conversation={conversation}
          agents={agents}
          departments={departments}
          operator={operator}
          paused={paused}
          onChanged={refresh}
          onSchedule={() => setScheduleOpen(true)}
          onResume={() => void resume()}
        />
      </ConversationThreadHeader>
      {conversation ? (
        <ConversationTagsControl
          conversationId={conversation.id}
          selected={conversation.tags}
          catalog={tags}
          onChanged={refresh}
        />
      ) : null}
      {conversation && scheduleOpen ? (
        <div className="shrink-0 border-b border-border bg-muted px-3 py-2">
          <ConversationSchedulePanel
            conversation={conversation}
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            hideTrigger
          />
        </div>
      ) : null}
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {threadBody === 'messages' ? (
          <div className="border-b border-border px-3 py-2">
            <Input
              value={search}
              placeholder="Buscar na conversa"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto bg-chat p-4">
          {threadBody === 'loading' ? (
            <ChatThreadSkeleton />
          ) : threadBody === 'empty' ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem mensagens nesta conversa
            </p>
          ) : visibleMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem com esse texto
            </p>
          ) : (
            <ChatMessageList
              messages={visibleMessages}
              pendingSend={pendingSend}
              mineFrom={lineRef.current?.instanceName || lineRef.current?.number || ''}
              onResend={(text) => void send({ text, file: null })}
              onReact={(messageId, emoji) => void react(messageId, emoji)}
              onReply={setReplyTo}
              bottomRef={bottomRef}
            />
          )}
        </div>
        {conversation ? (
          <div className="border-t border-border px-3 py-2">
            <TeamNotes conversationId={conversation.id} operator={operator} />
          </div>
        ) : null}
        <MessageComposer
          sending={sending}
          error={error}
          disabled={conversation?.status === 'closed'}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          presenceTo={phone}
          conversationId={conversationId}
          onSend={send}
        />
      </CardContent>
    </Card>
  );
}
