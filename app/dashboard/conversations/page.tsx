'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
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
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { isClosedTab, isIncomingTab, isWaitingTab, matchesMineFilter } from '@/core/entities/conversationTabs';
import {
  DepartmentFilter,
  QueueTab,
  matchesDepartmentFilter,
} from '@/core/entities/conversationDepartment';
import { ConversationInboxList } from '@/ui/components/conversation-inbox-list';
import { MessageThread } from '@/ui/components/message-thread';
import { WhatsAppDisconnectedBanner } from '@/ui/components/whatsapp-status';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { playInboxChime, shouldPlayInboxSound } from '@/ui/lib/inbox-notify';
import { queueTabActiveClass } from '@/ui/lib/status-tone';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [operator, setOperator] = useState<User | null>(null);
  const [mineOnly, setMineOnly] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('all');
  const departmentFilterReady = useRef(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming');
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPhone = searchParams.get('contact') ?? '';
  const previousConversations = useRef<Conversation[] | null>(null);

  useEffect(() => {
    setMounted(true);
    loadConversations(true);
    const timer = setInterval(() => loadConversations(false), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const loadConversations = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [allConversations, agentList, departmentList, user] = await Promise.all([
        new GetAllConversationsUseCase().execute(),
        new AgentCatalogUseCase().list(),
        new DepartmentCatalogUseCase().list(),
        new GetCurrentUserUseCase().execute(),
      ]);
      setConversations(allConversations);
      if (shouldPlayInboxSound(previousConversations.current, allConversations)) {
        playInboxChime();
      }
      previousConversations.current = allConversations;
      setAgents(agentList);
      setDepartments(departmentList);
      setOperator(user);
      if (!departmentFilterReady.current) {
        departmentFilterReady.current = true;
        const assignment = user ? assignmentFromOperator(user, agentList) : null;
        if (assignment?.departmentId) {
          setDepartmentFilter(assignment.departmentId);
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

  const openContact = (phone: string) => {
    router.push(`/dashboard/conversations?contact=${encodeURIComponent(phone)}`);
  };

  const operatorAgentId = operator
    ? assignmentFromOperator(operator, agents).agentId
    : undefined;
  const tab = activeTab as QueueTab;

  const filteredConversations = conversations.filter((conv) => {
    if (tab === 'incoming' && !isIncomingTab(conv)) return false;
    if (tab === 'waiting' && !isWaitingTab(conv)) return false;
    if (tab === 'closed' && !isClosedTab(conv)) return false;
    if (!matchesMineFilter(conv, tab, mineOnly, operatorAgentId)) return false;
    if (!matchesDepartmentFilter(conv, tab, departmentFilter)) return false;
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      conv.contactName.toLowerCase().includes(searchTerm) ||
      conv.contactPhone.includes(searchTerm) ||
      conv.departmentName?.toLowerCase().includes(searchTerm) ||
      conv.assignedAgentName?.toLowerCase().includes(searchTerm)
    );
  });

  const incomingCount = conversations.filter(
    (conv) => isIncomingTab(conv) && matchesDepartmentFilter(conv, 'incoming', departmentFilter)
  ).length;
  const waitingCount = conversations.filter(
    (conv) =>
      isWaitingTab(conv) &&
      matchesMineFilter(conv, 'waiting', mineOnly, operatorAgentId) &&
      matchesDepartmentFilter(conv, 'waiting', departmentFilter)
  ).length;
  const closedCount = conversations.filter(
    (conv) =>
      isClosedTab(conv) &&
      matchesMineFilter(conv, 'closed', mineOnly, operatorAgentId) &&
      matchesDepartmentFilter(conv, 'closed', departmentFilter)
  ).length;

  if (loading) {
    return <div className="text-center py-8 text-foreground">Carregando...</div>;
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] flex-col gap-3">
      <WhatsAppDisconnectedBanner />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={departmentFilter}
          aria-label="Filtrar por setor"
          onChange={(event) => setDepartmentFilter(event.target.value)}
          style={
            departmentFilter !== 'all' && departmentFilter !== 'none'
              ? {
                  borderLeftWidth: 6,
                  borderLeftColor:
                    departments.find((item) => item.id === departmentFilter)?.color || undefined,
                }
              : undefined
          }
        >
          <option value="all">Todos os setores</option>
          <option value="none">Sem setor</option>
          {departments
            .filter((item) => item.isActive)
            .map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
        </select>
        <Button
          type="button"
          variant={mineOnly ? 'outline' : 'default'}
          size="sm"
          onClick={() => setMineOnly((value) => !value)}
        >
          {mineOnly ? 'Ver o time' : 'Só as minhas'}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <aside
          className={`flex min-h-0 flex-col rounded-lg border border-border bg-card ${
            selectedPhone ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="shrink-0 space-y-3 border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
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
            <ConversationInboxList
              conversations={filteredConversations}
              departments={departments}
              selectedPhone={selectedPhone}
              mounted={mounted}
              onSelect={openContact}
            />
          </div>
        </aside>

        <section className={selectedPhone ? 'min-h-0' : 'hidden min-h-0 lg:block'}>
          {selectedPhone ? (
            <MessageThread
              contact={selectedPhone}
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
