import { Conversation } from './Conversation';
import { DepartmentFilter, QueueTab, matchesDepartmentFilter } from './conversationDepartment';
import {
  isClosedTab,
  isIncomingTab,
  isWaitingTab,
  matchesMineFilter,
} from './conversationTabs';

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
  lineFilter: LineFilter = 'all'
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
  const term = search.trim().toLowerCase();
  if (!term) {
    return true;
  }
  return (
    conversation.contactName.toLowerCase().includes(term) ||
    conversation.contactPhone.includes(term) ||
    (conversation.departmentName?.toLowerCase().includes(term) ?? false) ||
    (conversation.assignedAgentName?.toLowerCase().includes(term) ?? false)
  );
}

export function inboxHiddenCount(
  conversations: Conversation[],
  tab: QueueTab,
  mineOnly: boolean,
  operatorAgentId: string | undefined,
  departmentFilter: DepartmentFilter,
  search: string,
  lineFilter: LineFilter = 'all'
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
      lineFilter
    )
  ).length;
  return Math.max(0, onTab - visible);
}

export const QUEUE_TAB_LABEL: Record<QueueTab, string> = {
  incoming: 'Entrada',
  waiting: 'Esperando',
  closed: 'Finalizados',
};
