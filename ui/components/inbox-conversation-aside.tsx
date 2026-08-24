'use client';

import { RefObject } from 'react';
import { Badge } from '@/ui/components/badge';
import { Input } from '@/ui/components/input';
import { Tabs, TabsList, TabsTrigger } from '@/ui/components/tabs';
import { Search } from 'lucide-react';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { QueueTab } from '@/core/entities/conversationDepartment';
import { QUEUE_TAB_LABEL } from '@/core/entities/inboxFilterHint';
import { ConversationInboxList } from '@/ui/components/conversation-inbox-list';
import { InboxFilterBanner } from '@/ui/components/inbox-guidance';
import { EmptyState } from '@/ui/components/empty-state';
import { QueueTone, queueTabActiveClass } from '@/ui/lib/status-tone';
import { cn } from '@/ui/lib/utils';

type InboxConversationAsideProps = {
  threadOpen: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  filter: string;
  onFilter: (value: string) => void;
  activeTab: string;
  onTab: (value: string) => void;
  incomingCount: number;
  waitingCount: number;
  closedCount: number;
  filteredConversations: Conversation[];
  conversationsLength: number;
  onTabCount: number;
  tab: QueueTab;
  hiddenCount: number;
  departments: Department[];
  numbers: WhatsAppNumber[];
  selectedId?: string;
  focusedId?: string;
  myAgentId?: string;
  mounted: boolean;
  onSelect: (conversation: Conversation) => void;
  onClearFilters: () => void;
};

function InboxQueueTabTrigger({
  value,
  tone,
  label,
  count,
  badgeVariant,
}: {
  value: string;
  tone: QueueTone;
  label: string;
  count: number;
  badgeVariant: 'warning' | 'info' | 'muted';
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        'flex h-full min-h-8 w-full min-w-0 flex-col gap-0.5 overflow-hidden whitespace-normal px-1 py-1.5 text-[11px] leading-tight shadow-none data-[state=active]:shadow-none sm:text-xs',
        queueTabActiveClass[tone],
      )}
    >
      <span className="max-w-full truncate">{label}</span>
      {count > 0 ? (
        <Badge
          variant={badgeVariant}
          className="h-4 min-w-4 justify-center px-1 py-0 text-[10px] leading-none"
        >
          {count}
        </Badge>
      ) : (
        <span className="h-4" aria-hidden />
      )}
    </TabsTrigger>
  );
}

export function InboxConversationAside({
  threadOpen,
  searchRef,
  filter,
  onFilter,
  activeTab,
  onTab,
  incomingCount,
  waitingCount,
  closedCount,
  filteredConversations,
  conversationsLength,
  onTabCount,
  tab,
  hiddenCount,
  departments,
  numbers,
  selectedId,
  focusedId,
  myAgentId,
  mounted,
  onSelect,
  onClearFilters,
}: InboxConversationAsideProps) {
  return (
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
            placeholder="Nome, telefone ou mensagem"
            className="bg-background pl-10"
            value={filter}
            onChange={(event) => onFilter(event.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={onTab}>
          <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 items-stretch gap-0.5 overflow-hidden p-1">
            <InboxQueueTabTrigger
              value="incoming"
              tone="incoming"
              label="Entrada"
              count={incomingCount}
              badgeVariant="warning"
            />
            <InboxQueueTabTrigger
              value="waiting"
              tone="waiting"
              label="Esperando"
              count={waitingCount}
              badgeVariant="info"
            />
            <InboxQueueTabTrigger
              value="closed"
              tone="closed"
              label="Finalizados"
              count={closedCount}
              badgeVariant="muted"
            />
          </TabsList>
        </Tabs>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <EmptyState
            title={
              conversationsLength === 0
                ? 'Ainda não há conversas'
                : onTabCount === 0
                  ? `Nenhuma conversa em ${QUEUE_TAB_LABEL[tab]}`
                  : 'Nenhuma conversa neste filtro'
            }
            description={
              conversationsLength === 0
                ? 'Conecte o WhatsApp e peça para alguém mandar um oi. O fluxo de triagem responde sozinho.'
                : onTabCount > 0
                  ? 'Há conversas nesta aba fora do setor, da linha, de “minhas” ou da busca.'
                  : 'Quando o bot ou um cliente falar, elas aparecem aqui.'
            }
            actionLabel={onTabCount > 0 ? 'Ver todas' : undefined}
            onAction={onTabCount > 0 ? onClearFilters : undefined}
          />
        ) : (
          <>
            <InboxFilterBanner hiddenCount={hiddenCount} tab={tab} onClear={onClearFilters} />
            <ConversationInboxList
              conversations={filteredConversations}
              departments={departments}
              numbers={numbers}
              selectedId={selectedId}
              focusedId={focusedId}
              myAgentId={myAgentId}
              mounted={mounted}
              onSelect={onSelect}
            />
          </>
        )}
      </div>
    </aside>
  );
}
