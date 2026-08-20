'use client';

import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import {
  conversationDisplayName,
  conversationPhotoUrl,
  conversationPreview,
  conversationPreviewIsOutgoing,
  conversationIsTyping,
  departmentColorOf,
  formatInboxTime,
} from '@/core/entities/conversationInbox';
import { cn } from '@/ui/lib/utils';
import { queueToneBar, queueToneOf } from '@/ui/lib/status-tone';
import { MessageStatusTicks } from '@/ui/components/message-status-ticks';
import { ConversationAvatar } from '@/ui/components/conversation-avatar';

type ConversationInboxListProps = {
  conversations: Conversation[];
  departments: Department[];
  numbers?: WhatsAppNumber[];
  selectedId?: string;
  mounted: boolean;
  onSelect: (conversation: Conversation) => void;
};

export function ConversationInboxList({
  conversations,
  departments,
  numbers = [],
  selectedId,
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
        const selected = selectedId === conversation.id;
        const color = departmentColorOf(departments, conversation.departmentId);
        const tone = queueToneOf(conversation);
        const lineName = numbers.find((item) => item.id === conversation.whatsappNumberId)?.name;
        return (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => onSelect(conversation)}
              className={cn(
                'relative flex w-full items-center gap-3 py-2 pl-4 pr-3 text-left transition-colors',
                selected ? 'bg-muted' : 'hover:bg-muted/70'
              )}
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', queueToneBar[tone])} />
              <ConversationAvatar
                name={conversationDisplayName(conversation)}
                photoUrl={conversationPhotoUrl(conversation)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate font-medium text-foreground">
                    {conversationDisplayName(conversation)}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {mounted ? formatInboxTime(conversation.lastActivity) : ''}
                  </span>
                </div>
                <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                  {conversationPreviewIsOutgoing(conversation) && conversation.lastMessage ? (
                    <MessageStatusTicks message={conversation.lastMessage} />
                  ) : null}
                  <span
                    className={cn(
                      'truncate',
                      conversationIsTyping(conversation) && 'italic text-primary'
                    )}
                  >
                    {conversationPreview(conversation)}
                  </span>
                </p>
                <div className="flex items-center justify-between gap-2">
                  {conversation.departmentName ? (
                    <span className="inline-flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color || 'hsl(var(--accent))' }}
                      />
                      {conversation.departmentName}
                      {lineName ? ` · ${lineName}` : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{lineName || 'Sem setor'}</span>
                  )}
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
