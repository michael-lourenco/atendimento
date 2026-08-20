'use client';

import { useMessageThread } from '@/ui/lib/use-message-thread';
import {
  conversationDisplayName,
  conversationPhotoUrl,
  conversationIsTyping,
} from '@/core/entities/conversationInbox';
import { MessageComposer } from '@/ui/components/message-composer';
import { ConversationActions } from '@/ui/components/conversation-actions';
import { ConversationSchedulePanel } from '@/ui/components/conversation-schedule-panel';
import { ConversationThreadHeader } from '@/ui/components/conversation-thread-header';
import { ConversationTagsControl } from '@/ui/components/conversation-tags-control';
import { TeamNotes } from '@/ui/components/team-notes';
import { Card, CardContent } from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { ChatThreadSkeleton } from '@/ui/components/chat-thread-skeleton';
import { ChatMessageList } from '@/ui/components/chat-message-list';
import { conversationThreadBody } from '@/ui/lib/conversation-thread-body';
import { messagesMatchingQuery } from '@/ui/lib/messages-matching-query';
import { queueToneOf } from '@/ui/lib/status-tone';

type MessageThreadProps = {
  conversationId: string;
  onBack?: () => void;
  onConversationChanged?: () => void;
};

export function MessageThread({ conversationId, onBack, onConversationChanged }: MessageThreadProps) {
  const thread = useMessageThread(conversationId, onConversationChanged);
  const {
    messages,
    paused,
    conversation,
    agents,
    departments,
    tags,
    operator,
    sending,
    pendingSend,
    error,
    messagesReady,
    lineName,
    scheduleOpen,
    setScheduleOpen,
    search,
    setSearch,
    replyTo,
    setReplyTo,
    bottomRef,
    lineRef,
    phone,
    send,
    react,
    resume,
    refresh,
  } = thread;

  const threadBody = conversationThreadBody({
    ready: messagesReady,
    messageCount: messages.length,
    hasPending: Boolean(pendingSend),
  });
  const visibleMessages = messagesMatchingQuery(messages, search);
  const title = conversation ? conversationDisplayName(conversation) : phone;
  const queueTone = conversation ? queueToneOf(conversation) : null;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <ConversationThreadHeader
        title={title}
        phone={phone}
        lineName={lineName || undefined}
        photoUrl={conversation ? conversationPhotoUrl(conversation) : undefined}
        typing={conversation ? conversationIsTyping(conversation) : false}
        queueTone={queueTone}
        onBack={onBack}
      >
        <ConversationActions
          conversation={conversation}
          agents={agents}
          departments={departments}
          operator={operator}
          paused={paused}
          onChanged={refresh}
          onSchedule={() => setScheduleOpen(true)}
          onResume={() => void resume()}
        />
      </ConversationThreadHeader>
      {conversation ? (
        <ConversationTagsControl
          conversationId={conversation.id}
          selected={conversation.tags}
          catalog={tags}
          onChanged={refresh}
        />
      ) : null}
      {conversation && scheduleOpen ? (
        <div className="shrink-0 border-b border-border bg-muted px-3 py-2">
          <ConversationSchedulePanel
            conversation={conversation}
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            hideTrigger
          />
        </div>
      ) : null}
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {threadBody === 'messages' ? (
          <div className="border-b border-border px-3 py-2">
            <Input
              value={search}
              placeholder="Buscar na conversa"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto bg-chat p-4">
          {threadBody === 'loading' ? (
            <ChatThreadSkeleton />
          ) : threadBody === 'empty' ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sem mensagens nesta conversa
            </p>
          ) : visibleMessages.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma mensagem com esse texto
            </p>
          ) : (
            <ChatMessageList
              messages={visibleMessages}
              pendingSend={pendingSend}
              mineFrom={lineRef.current?.instanceName || lineRef.current?.number || ''}
              onResend={(text) => void send({ text, file: null })}
              onReact={(messageId, emoji) => void react(messageId, emoji)}
              onReply={setReplyTo}
              bottomRef={bottomRef}
            />
          )}
        </div>
        {conversation ? (
          <div className="border-t border-border px-3 py-2">
            <TeamNotes conversationId={conversation.id} operator={operator} />
          </div>
        ) : null}
        <MessageComposer
          sending={sending}
          error={error}
          disabled={conversation?.status === 'closed'}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          presenceTo={phone}
          conversationId={conversationId}
          conversationDepartmentId={conversation?.departmentId}
          onSend={send}
        />
      </CardContent>
    </Card>
  );
}
