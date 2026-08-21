import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import { conversationMatchesMessageText } from './lastMessageForConversation';
import { DepartmentFilter, QueueTab, matchesDepartmentFilter } from './conversationDepartment';
import {
  isClosedTab,
  isIncomingTab,
  isWaitingTab,
  matchesMineFilter,
} from './conversationTabs';
import { matchesTagFilter, TagFilter } from './tagFilter';

export function conversationOnQueueTab(
  conversation: Conversation,
  tab: QueueTab
): boolean {
  if (tab === 'incoming') {
    return isIncomingTab(conversation);
  }
  if (tab === 'waiting') {
    return isWaitingTab(conversation);
  }
  return isClosedTab(conversation);
}

export type LineFilter = 'all' | string;
export type { TagFilter };

export type InboxSearchCorpus = {
  messages: Message[];
  numbers: WhatsAppNumber[];
};

export function matchesLineFilter(
  conversation: Conversation,
  lineFilter: LineFilter
): boolean {
  if (lineFilter === 'all') {
    return true;
  }
  return conversation.whatsappNumberId === lineFilter;
}

export function conversationMatchesInboxFilters(
  conversation: Conversation,
  tab: QueueTab,
  mineOnly: boolean,
  operatorAgentId: string | undefined,
  departmentFilter: DepartmentFilter,
  search: string,
  lineFilter: LineFilter = 'all',
  corpus?: InboxSearchCorpus,
  tagFilter: TagFilter = 'all'
): boolean {
  if (!conversationOnQueueTab(conversation, tab)) {
    return false;
  }
  if (!matchesMineFilter(conversation, tab, mineOnly, operatorAgentId)) {
    return false;
  }
  if (!matchesDepartmentFilter(conversation, tab, departmentFilter)) {
    return false;
  }
  if (!matchesLineFilter(conversation, lineFilter)) {
    return false;
  }
  if (!matchesTagFilter(conversation.tags, tagFilter)) {
    return false;
  }
  const term = search.trim().toLowerCase();
  if (!term) {
    return true;
  }
  if (
    conversation.contactName.toLowerCase().includes(term) ||
    conversation.contactPhone.includes(term) ||
    (conversation.departmentName?.toLowerCase().includes(term) ?? false) ||
    (conversation.assignedAgentName?.toLowerCase().includes(term) ?? false)
  ) {
    return true;
  }
  return conversationMatchesMessageText(
    conversation,
    term,
    corpus?.messages ?? [],
    corpus?.numbers ?? []
  );
}

export function inboxHiddenCount(
  conversations: Conversation[],
  tab: QueueTab,
  mineOnly: boolean,
  operatorAgentId: string | undefined,
  departmentFilter: DepartmentFilter,
  search: string,
  lineFilter: LineFilter = 'all',
  corpus?: InboxSearchCorpus,
  tagFilter: TagFilter = 'all'
): number {
  const onTab = conversations.filter((item) => conversationOnQueueTab(item, tab)).length;
  const visible = conversations.filter((item) =>
    conversationMatchesInboxFilters(
      item,
      tab,
      mineOnly,
      operatorAgentId,
      departmentFilter,
      search,
      lineFilter,
      corpus,
      tagFilter
    )
  ).length;
  return Math.max(0, onTab - visible);
}

export function nextIncomingQueueConversation(
  conversations: Conversation[],
  closedId: string,
  mineOnly: boolean,
  operatorAgentId: string | undefined,
  departmentFilter: DepartmentFilter,
  lineFilter: LineFilter = 'all',
  tagFilter: TagFilter = 'all'
): Conversation | undefined {
  const queue = conversations.filter((item) =>
    conversationMatchesInboxFilters(
      item,
      'incoming',
      mineOnly,
      operatorAgentId,
      departmentFilter,
      '',
      lineFilter,
      undefined,
      tagFilter
    )
  );
  const remaining = queue.filter((item) => item.id !== closedId);
  if (remaining.length === 0) {
    return undefined;
  }
  const index = queue.findIndex((item) => item.id === closedId);
  if (index < 0) {
    return remaining[0];
  }
  return remaining[Math.min(index, remaining.length - 1)];
}

export const QUEUE_TAB_LABEL: Record<QueueTab, string> = {
  incoming: 'Entrada',
  waiting: 'Esperando',
  closed: 'Finalizados',
};

export function inboxTabCount(
  conversations: Conversation[],
  tab: QueueTab,
  mineOnly: boolean,
  operatorAgentId: string | undefined,
  departmentFilter: DepartmentFilter,
  lineFilter: LineFilter = 'all',
  tagFilter: TagFilter = 'all'
): number {
  return conversations.filter((item) =>
    conversationMatchesInboxFilters(
      item,
      tab,
      mineOnly,
      operatorAgentId,
      departmentFilter,
      '',
      lineFilter,
      undefined,
      tagFilter
    )
  ).length;
}
