'use client';

import { useEffect } from 'react';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import {
  conversationDisplayName,
  conversationPhotoUrl,
  conversationPreview,
  conversationPreviewIsOutgoing,
  conversationPreviewFailed,
  conversationIsTyping,
  departmentColorOf,
  formatInboxTime,
} from '@/core/entities/conversationInbox';
import { cn } from '@/ui/lib/utils';
import { queueToneBar, queueToneOf } from '@/ui/lib/status-tone';
import { queueWaitLabel } from '@/core/entities/slaMetrics';
import { conversationViewerName } from '@/core/entities/conversationViewer';
import { MessageStatusTicks } from '@/ui/components/message-status-ticks';
import { ConversationAvatar } from '@/ui/components/conversation-avatar';

type ConversationInboxListProps = {
  conversations: Conversation[];
  departments: Department[];
  numbers?: WhatsAppNumber[];
  selectedId?: string;
  focusedId?: string;
  myAgentId?: string;
  mounted: boolean;
  onSelect: (conversation: Conversation) => void;
};

export function ConversationInboxList({
  conversations,
  departments,
  numbers = [],
  selectedId,
  focusedId,
  myAgentId,
  mounted,
  onSelect,
}: ConversationInboxListProps) {
  useEffect(() => {
    if (!focusedId) {
      return;
    }
    document.getElementById(`inbox-row-${focusedId}`)?.scrollIntoView({ block: 'nearest' });
  }, [focusedId]);
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
        const wait = queueWaitLabel(conversation);
        const failed = conversationPreviewFailed(conversation);
        const focused = focusedId === conversation.id;
        const viewer = conversationViewerName(conversation, myAgentId);
        const lineName = numbers.find((item) => item.id === conversation.whatsappNumberId)?.name;
        return (
          <li key={conversation.id}>
            <button
              type="button"
              id={`inbox-row-${conversation.id}`}
              onClick={() => onSelect(conversation)}
              className={cn(
                'relative flex w-full items-center gap-3 py-2 pl-4 pr-3 text-left transition-colors',
                selected ? 'bg-muted' : 'hover:bg-muted/70',
                focused && !selected ? 'bg-muted/60' : null
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
                      conversationIsTyping(conversation) && 'italic text-primary',
                      failed && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {conversationPreview(conversation)}
                  </span>
                </p>
                {viewer ? (
                  <p className="truncate text-xs text-sky-700 dark:text-sky-300">
                    {viewer} está nesta conversa
                  </p>
                ) : null}
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
                  <span className="flex shrink-0 items-center gap-1">
                    {failed ? (
                      <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-300">
                        Falhou
                      </span>
                    ) : null}
                    {tone === 'incoming' && wait ? (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                          wait === 'sem dono'
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {wait}
                      </span>
                    ) : null}
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
