'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Conversation } from '@/core/entities/Conversation';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { DepartmentFilter, QueueTab } from '@/core/entities/conversationDepartment';
import {
  LineFilter,
  conversationMatchesInboxFilters,
  conversationOnQueueTab,
  inboxHiddenCount,
  nextIncomingQueueConversation,
} from '@/core/entities/inboxFilterHint';
import { inboxHrefForConversation } from '@/ui/lib/inbox-href';
import { InboxConversationAside } from '@/ui/components/inbox-conversation-aside';
import { MessageThread } from '@/ui/components/message-thread';
import { WhatsAppDisconnectedBanner } from '@/ui/components/whatsapp-status';
import { OperatorAgentBanner } from '@/ui/components/inbox-guidance';
import { InboxSkeleton } from '@/ui/components/inbox-skeleton';
import { InboxFilterBar } from '@/ui/components/inbox-filter-bar';
import { conversationFromInboxQuery } from '@/core/entities/conversationThread';
import { conversationPhotoUrl } from '@/core/entities/conversationInbox';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { playInboxChime, shouldPlayInboxSound } from '@/ui/lib/inbox-notify';
import { useInboxDocumentTitle, useInboxShortcuts } from '@/ui/lib/use-inbox-chrome';
import { useInboxRealtime } from '@/ui/lib/use-inbox-realtime';
import { useInboxMessageSearch } from '@/ui/lib/use-inbox-message-search';
import { syncInboxAvatars } from '@/ui/lib/sync-inbox-avatars';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [operator, setOperator] = useState<User | null>(null);
  const [mineOnly, setMineOnly] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('all');
  const [lineFilter, setLineFilter] = useState<LineFilter>('all');
  const departmentFilterReady = useRef(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming');
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get('conversation') ?? '';
  const selectedPhone = searchParams.get('contact') ?? '';
  const previousConversations = useRef<Conversation[] | null>(null);
  const avatarsTried = useRef(false);
  const { searchCorpus, loadSearchMessages } = useInboxMessageSearch(filter, numbers);

  useEffect(() => {
    setMounted(true);
    void loadConversations(true, true);
    const timer = setInterval(() => void loadConversations(false, false), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useInboxRealtime(() => {
    void loadConversations(false, false);
  });

  useInboxDocumentTitle(conversations);
  useInboxShortcuts({
    searchRef,
    selectedPhone: selectedConversationId || selectedPhone,
    onBack: () => router.push('/dashboard/conversations'),
  });

  const loadConversations = async (showLoading = false, refreshCatalogs = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const allConversations = await clientUseCases.conversations().execute(false);
      setConversations(allConversations);
      await loadSearchMessages();
      if (shouldPlayInboxSound(previousConversations.current, allConversations)) {
        playInboxChime();
      }
      previousConversations.current = allConversations;

      if (refreshCatalogs && !avatarsTried.current) {
        avatarsTried.current = true;
        if (allConversations.some((item) => !conversationPhotoUrl(item))) {
          void (async () => {
            for (let pass = 0; pass < 5; pass += 1) {
              const filled = await syncInboxAvatars();
              if (!filled) {
                break;
              }
              await loadConversations(false, false);
            }
          })();
        }
      }

      if (refreshCatalogs) {
        const [agentList, departmentList, numberList, user] = await Promise.all([
          clientUseCases.agents().list(),
          clientUseCases.departments().list(),
          listWhatsAppNumbersCached(),
          clientUseCases.currentUser().execute(),
        ]);
        setAgents(agentList);
        setDepartments(departmentList);
        setNumbers(numberList);
        setOperator(user);
        if (!departmentFilterReady.current) {
          departmentFilterReady.current = true;
          const deptId = user ? assignmentFromOperator(user, agentList)?.departmentId : undefined;
          if (deptId) setDepartmentFilter(deptId);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const openConversation = (conversation: Conversation) => {
    router.push(`/dashboard/conversations?conversation=${encodeURIComponent(conversation.id)}`);
  };

  const selectedConversation = conversationFromInboxQuery(conversations, {
    conversationId: selectedConversationId,
    contactPhone: selectedPhone,
  });

  const threadOpen = Boolean(selectedConversation);
  const operatorAssignment = operator ? assignmentFromOperator(operator, agents) : null;
  const operatorAgentId = operatorAssignment?.agentId;
  const tab = activeTab as QueueTab;

  const filteredConversations = conversations.filter((conv) =>
    conversationMatchesInboxFilters(
      conv,
      tab,
      mineOnly,
      operatorAgentId,
      departmentFilter,
      filter,
      lineFilter,
      searchCorpus
    )
  );
  const hiddenCount = inboxHiddenCount(
    conversations,
    tab,
    mineOnly,
    operatorAgentId,
    departmentFilter,
    filter,
    lineFilter,
    searchCorpus
  );
  const onTabCount = conversations.filter((conv) => conversationOnQueueTab(conv, tab)).length;

  const countTab = (queue: QueueTab) =>
    conversations.filter((conv) =>
      conversationMatchesInboxFilters(
        conv,
        queue,
        mineOnly,
        operatorAgentId,
        departmentFilter,
        '',
        lineFilter
      )
    ).length;

  const clearInboxFilters = () => {
    setDepartmentFilter('all');
    setLineFilter('all');
    setMineOnly(false);
    setFilter('');
  };

  const openNextAfterClose = (closedId: string) => {
    const next = nextIncomingQueueConversation(
      conversations,
      closedId,
      mineOnly,
      operatorAgentId,
      departmentFilter,
      lineFilter
    );
    setActiveTab('incoming');
    if (next) {
      router.push(inboxHrefForConversation(next.id));
      return;
    }
    router.push('/dashboard/conversations');
  };

  if (loading) {
    return <InboxSkeleton />;
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] flex-col gap-3">
      <WhatsAppDisconnectedBanner />
      {operator && operatorAssignment && !operatorAssignment.linked ? (
        <OperatorAgentBanner email={operator.email} />
      ) : null}
      <InboxFilterBar
        numbers={numbers}
        departments={departments}
        lineFilter={lineFilter}
        departmentFilter={departmentFilter}
        mineOnly={mineOnly}
        onLineFilter={setLineFilter}
        onDepartmentFilter={setDepartmentFilter}
        onMineOnly={() => setMineOnly((value) => !value)}
      />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <InboxConversationAside
          threadOpen={threadOpen}
          searchRef={searchRef}
          filter={filter}
          onFilter={setFilter}
          activeTab={activeTab}
          onTab={setActiveTab}
          incomingCount={countTab('incoming')}
          waitingCount={countTab('waiting')}
          closedCount={countTab('closed')}
          filteredConversations={filteredConversations}
          conversationsLength={conversations.length}
          onTabCount={onTabCount}
          tab={tab}
          hiddenCount={hiddenCount}
          departments={departments}
          numbers={numbers}
          selectedId={selectedConversation?.id}
          mounted={mounted}
          onSelect={openConversation}
          onClearFilters={clearInboxFilters}
        />

        <section className={threadOpen ? 'min-h-0' : 'hidden min-h-0 lg:block'}>
          {selectedConversation ? (
            <MessageThread
              key={selectedConversation.id}
              conversationId={selectedConversation.id}
              onBack={() => router.push('/dashboard/conversations')}
              onConversationChanged={() => loadConversations()}
              onClosed={openNextAfterClose}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-chat text-sm text-muted-foreground">
              Selecione uma conversa para atender
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
