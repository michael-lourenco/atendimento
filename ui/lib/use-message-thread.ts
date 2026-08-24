'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/core/entities/Message';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { Tag } from '@/core/entities/Tag';
import { User } from '@/core/entities/User';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { coalesceMessageList, nextMessageReactions } from '@/core/entities/messageReaction';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { useInboxRealtime } from '@/ui/lib/use-inbox-realtime';
import { postThreadMessage } from '@/ui/lib/post-thread-message';
import { notifyWhatsAppRead } from '@/ui/lib/notify-whatsapp-read';

export function useMessageThread(conversationId: string, onConversationChanged?: () => void) {
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
      await clientUseCases.markConversationRead().execute(conversationId);
    } catch {
      // zerar não lidas não pode esconder o chat
    }
    notifyWhatsAppRead(conversationId);
    if (isCancelled()) return;
    const conv = await clientUseCases.conversationById().execute(conversationId);
    if (isCancelled()) return;
    if (refreshCatalogs) {
      const [agentList, departmentList, user, numberList, tagList] = await Promise.all([
        clientUseCases.agents().list(),
        clientUseCases.departments().list(),
        clientUseCases.currentUser().execute(),
        listWhatsAppNumbersCached(),
        clientUseCases.tags().list(),
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
      clientUseCases.messagesByContact().execute(phone, lineRef.current),
      clientUseCases.flowSession().execute(conversationId),
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
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setMessagesReady(true);
        }
      });
    const timer = setInterval(() => {
      load(false, isCancelled).catch(() => undefined);
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
      const reopening = conversation?.status === 'closed';
      await postThreadMessage({
        to: phone,
        conversationId,
        text: input.text,
        file: input.file,
        quotedMessageId: input.quotedMessageId,
      });
      setPaused(!reopening);
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
      await clientUseCases.resumeContactFlow().execute(conversationId);
      setPaused(false);
    } catch {
      setError('Não foi possível retomar o chatbot');
    }
  };

  return {
    messages,
    paused,
    conversation,
    agents,
    departments,
    tags,
    operator,
    sending,
    pendingSend,
    error,
    messagesReady,
    lineName,
    scheduleOpen,
    setScheduleOpen,
    search,
    setSearch,
    replyTo,
    setReplyTo,
    bottomRef,
    lineRef,
    phone,
    send,
    react,
    resume,
    refresh,
  };
}
