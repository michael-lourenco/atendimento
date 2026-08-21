'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Conversation } from '@/core/entities/Conversation';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { Tag } from '@/core/entities/Tag';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { QueueTab } from '@/core/entities/conversationDepartment';
import {
  TagFilter,
  conversationMatchesInboxFilters,
  conversationOnQueueTab,
  inboxHiddenCount,
  inboxTabCount,
  nextIncomingQueueConversation,
} from '@/core/entities/inboxFilterHint';
import { inboxHrefForConversation } from '@/ui/lib/inbox-href';
import { InboxConversationAside } from '@/ui/components/inbox-conversation-aside';
import { MessageThread } from '@/ui/components/message-thread';
import { WhatsAppDisconnectedBanner } from '@/ui/components/whatsapp-status';
import { OperatorAgentBanner } from '@/ui/components/inbox-guidance';
import { InboxSetupChecklist } from '@/ui/components/inbox-setup-checklist';
import { InboxSkeleton } from '@/ui/components/inbox-skeleton';
import { InboxFilterBar } from '@/ui/components/inbox-filter-bar';
import { conversationFromInboxQuery } from '@/core/entities/conversationThread';
import { conversationPhotoUrl } from '@/core/entities/conversationInbox';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { playInboxChime, shouldPlayInboxSound } from '@/ui/lib/inbox-notify';
import { useInboxDocumentTitle, useInboxShortcuts } from '@/ui/lib/use-inbox-chrome';
import { useInboxFilterPrefs } from '@/ui/lib/use-inbox-filter-prefs';
import { InboxShortcutSheet } from '@/ui/components/inbox-shortcut-sheet';
import { useInboxRealtime } from '@/ui/lib/use-inbox-realtime';
import { useInboxMessageSearch } from '@/ui/lib/use-inbox-message-search';
import { syncInboxAvatars } from '@/ui/lib/sync-inbox-avatars';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [operator, setOperator] = useState<User | null>(null);
  const operatorAssignment = operator ? assignmentFromOperator(operator, agents) : null;
  const { mineOnly, setMineOnly, departmentFilter, setDepartmentFilter, lineFilter, setLineFilter } =
    useInboxFilterPrefs(operator?.id, operatorAssignment?.departmentId);
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [helpOpen, setHelpOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming');
  const [focusedIndex, setFocusedIndex] = useState(0);
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
        const [agentList, departmentList, numberList, user, tagList] = await Promise.all([
          clientUseCases.agents().list(),
          clientUseCases.departments().list(),
          listWhatsAppNumbersCached(),
          clientUseCases.currentUser().execute(),
          clientUseCases.tags().list(),
        ]);
        setAgents(agentList);
        setDepartments(departmentList);
        setNumbers(numberList);
        setOperator(user);
        setTags(tagList);
      }
    } catch {
      /* ignore */
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
      searchCorpus,
      tagFilter
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
    searchCorpus,
    tagFilter
  );
  const onTabCount = conversations.filter((conv) => conversationOnQueueTab(conv, tab)).length;
  const focusIndex =
    filteredConversations.length === 0
      ? 0
      : Math.min(focusedIndex, filteredConversations.length - 1);

  useInboxShortcuts({
    searchRef,
    threadOpen,
    helpOpen,
    focusedIndex: focusIndex,
    listLength: filteredConversations.length,
    onBack: () => router.push('/dashboard/conversations'),
    onFocusIndex: setFocusedIndex,
    onOpenIndex: (index) => {
      const item = filteredConversations[index];
      if (item) openConversation(item);
    },
    onToggleHelp: () => setHelpOpen((value) => !value),
    onCloseHelp: () => setHelpOpen(false),
  });

  const countTab = (queue: QueueTab) =>
    inboxTabCount(
      conversations,
      queue,
      mineOnly,
      operatorAgentId,
      departmentFilter,
      lineFilter,
      tagFilter
    );

  const clearInboxFilters = () => {
    setDepartmentFilter('all');
    setLineFilter('all');
    setTagFilter('all');
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
      lineFilter,
      tagFilter
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
      <InboxShortcutSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
      <WhatsAppDisconnectedBanner />
      <InboxSetupChecklist operator={operator} />
      {operator && operatorAssignment && !operatorAssignment.linked ? (
        <OperatorAgentBanner email={operator.email} />
      ) : null}
      <InboxFilterBar
        numbers={numbers}
        departments={departments}
        tags={tags}
        lineFilter={lineFilter}
        departmentFilter={departmentFilter}
        tagFilter={tagFilter}
        mineOnly={mineOnly}
        onLineFilter={setLineFilter}
        onDepartmentFilter={setDepartmentFilter}
        onTagFilter={setTagFilter}
        onMineOnly={() => setMineOnly((value) => !value)}
        onHelp={() => setHelpOpen(true)}
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
          focusedId={filteredConversations[focusIndex]?.id}
          myAgentId={operatorAgentId}
          mounted={mounted}
          onSelect={(conversation) => {
            setFocusedIndex(filteredConversations.findIndex((item) => item.id === conversation.id));
            openConversation(conversation);
          }}
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
