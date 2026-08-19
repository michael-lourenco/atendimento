'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/ui/components/badge';
import { Input } from '@/ui/components/input';
import { Tabs, TabsList, TabsTrigger } from '@/ui/components/tabs';
import { Search } from 'lucide-react';
import { GetAllConversationsUseCase } from '@/core/usecases/GetAllConversationsUseCase';
import { AgentCatalogUseCase } from '@/core/usecases/AgentCatalogUseCase';
import { DepartmentCatalogUseCase } from '@/core/usecases/DepartmentCatalogUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { Conversation } from '@/core/entities/Conversation';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { DepartmentFilter, QueueTab } from '@/core/entities/conversationDepartment';
import {
  LineFilter,
  QUEUE_TAB_LABEL,
  conversationMatchesInboxFilters,
  conversationOnQueueTab,
  inboxHiddenCount,
} from '@/core/entities/inboxFilterHint';
import { ConversationInboxList } from '@/ui/components/conversation-inbox-list';
import { MessageThread } from '@/ui/components/message-thread';
import { WhatsAppDisconnectedBanner } from '@/ui/components/whatsapp-status';
import { InboxFilterBanner, OperatorAgentBanner } from '@/ui/components/inbox-guidance';
import { EmptyState } from '@/ui/components/empty-state';
import { InboxSkeleton } from '@/ui/components/inbox-skeleton';
import { InboxFilterBar } from '@/ui/components/inbox-filter-bar';
import { conversationFromInboxQuery } from '@/core/entities/conversationThread';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { playInboxChime, shouldPlayInboxSound } from '@/ui/lib/inbox-notify';
import { useInboxDocumentTitle, useInboxShortcuts } from '@/ui/lib/use-inbox-chrome';
import { queueTabActiveClass } from '@/ui/lib/status-tone';

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

  useEffect(() => {
    setMounted(true);
    void loadConversations(true, true);
    const timer = setInterval(() => void loadConversations(false, false), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, []);

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
      const allConversations = await new GetAllConversationsUseCase().execute();
      setConversations(allConversations);
      if (shouldPlayInboxSound(previousConversations.current, allConversations)) {
        playInboxChime();
      }
      previousConversations.current = allConversations;

      if (refreshCatalogs) {
        const [agentList, departmentList, numberList, user] = await Promise.all([
          new AgentCatalogUseCase().list(),
          new DepartmentCatalogUseCase().list(),
          listWhatsAppNumbersCached(),
          new GetCurrentUserUseCase().execute(),
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
    router.push(
      `/dashboard/conversations?conversation=${encodeURIComponent(conversation.id)}`
    );
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
      lineFilter
    )
  );
  const hiddenCount = inboxHiddenCount(
    conversations,
    tab,
    mineOnly,
    operatorAgentId,
    departmentFilter,
    filter,
    lineFilter
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
  const incomingCount = countTab('incoming');
  const waitingCount = countTab('waiting');
  const closedCount = countTab('closed');

  const clearInboxFilters = () => {
    setDepartmentFilter('all');
    setLineFilter('all');
    setMineOnly(false);
    setFilter('');
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
        <aside
          className={`flex min-h-0 flex-col rounded-lg border border-border bg-card ${
            threadOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="shrink-0 space-y-3 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Nome ou telefone"
                className="bg-background pl-10"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="incoming" className={`text-xs sm:text-sm ${queueTabActiveClass.incoming}`}>
                  Entrada
                  {incomingCount > 0 ? (
                    <Badge variant="warning" className="ml-1">
                      {incomingCount}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="waiting" className={`text-xs sm:text-sm ${queueTabActiveClass.waiting}`}>
                  Esperando
                  {waitingCount > 0 ? (
                    <Badge variant="info" className="ml-1">
                      {waitingCount}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="closed" className={`text-xs sm:text-sm ${queueTabActiveClass.closed}`}>
                  Finalizados
                  {closedCount > 0 ? (
                    <Badge variant="muted" className="ml-1">
                      {closedCount}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <EmptyState
                title={
                  conversations.length === 0
                    ? 'Ainda não há conversas'
                    : onTabCount === 0
                      ? `Nenhuma conversa em ${QUEUE_TAB_LABEL[tab]}`
                      : 'Nenhuma conversa neste filtro'
                }
                description={
                  conversations.length === 0
                    ? 'Conecte o WhatsApp e peça para alguém mandar um oi. O fluxo de triagem responde sozinho.'
                    : onTabCount > 0
                      ? 'Há conversas nesta aba fora do setor, da linha, de “minhas” ou da busca.'
                      : 'Quando o bot ou um cliente falar, elas aparecem aqui.'
                }
                actionLabel={onTabCount > 0 ? 'Ver todas' : undefined}
                onAction={onTabCount > 0 ? clearInboxFilters : undefined}
              />
            ) : (
              <>
                <InboxFilterBanner
                  hiddenCount={hiddenCount}
                  tab={tab}
                  onClear={clearInboxFilters}
                />
                <ConversationInboxList
                  conversations={filteredConversations}
                  departments={departments}
                  numbers={numbers}
                  selectedId={selectedConversation?.id}
                  mounted={mounted}
                  onSelect={openConversation}
                />
              </>
            )}
          </div>
        </aside>

        <section className={threadOpen ? 'min-h-0' : 'hidden min-h-0 lg:block'}>
          {selectedConversation ? (
            <MessageThread
              conversationId={selectedConversation.id}
              onBack={() => router.push('/dashboard/conversations')}
              onConversationChanged={() => loadConversations()}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-card text-sm text-muted-foreground">
              Selecione uma conversa para atender
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
