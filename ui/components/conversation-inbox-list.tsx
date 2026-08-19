'use client';

import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import {
  conversationDisplayName,
  conversationPreview,
  departmentColorOf,
  formatInboxTime,
} from '@/core/entities/conversationInbox';
import { cn } from '@/ui/lib/utils';

type ConversationInboxListProps = {
  conversations: Conversation[];
  departments: Department[];
  selectedPhone?: string;
  mounted: boolean;
  onSelect: (phone: string) => void;
};

export function ConversationInboxList({
  conversations,
  departments,
  selectedPhone,
  mounted,
  onSelect,
}: ConversationInboxListProps) {
  if (conversations.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        Nenhuma conversa nesta aba
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {conversations.map((conversation) => {
        const selected = selectedPhone === conversation.contactPhone;
        const color = departmentColorOf(departments, conversation.departmentId);
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation.contactPhone)}
              className={cn(
                'flex w-full flex-col gap-1 px-3 py-3 text-left transition-colors',
                selected ? 'bg-accent/15' : 'hover:bg-muted/60'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate font-medium text-foreground">
                  {conversationDisplayName(conversation)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {mounted ? formatInboxTime(conversation.lastActivity) : ''}
                </span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {conversationPreview(conversation)}
              </p>
              <div className="flex items-center justify-between gap-2">
                {conversation.departmentName ? (
                  <span className="inline-flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: color || 'hsl(var(--accent))' }}
                    />
                    {conversation.departmentName}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem setor</span>
                )}
                {conversation.unreadCount > 0 ? (
                  <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                    {conversation.unreadCount}
                  </span>
                ) : null}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
