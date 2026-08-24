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
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { useConversationViewer } from '@/ui/lib/use-conversation-viewer';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { conversationViewerName } from '@/core/entities/conversationViewer';
import { useEffect, useRef, useState } from 'react';

type MessageThreadProps = {
  conversationId: string;
  onBack?: () => void;
  onConversationChanged?: () => void;
  onClosed?: (conversationId: string) => void;
};

export function MessageThread({
  conversationId,
  onBack,
  onConversationChanged,
  onClosed,
}: MessageThreadProps) {
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
  const { show, kind, message, flashSuccess, flashError } = useCatalogSavedFlash();
  const threadSearchRef = useRef<HTMLInputElement>(null);
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    setNotesCount(0);
  }, [conversationId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'f') {
        return;
      }
      event.preventDefault();
      threadSearchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const assignment = operator ? assignmentFromOperator(operator, agents) : null;
  useConversationViewer(conversationId, assignment?.agentId, assignment?.agentName);
  const viewerName = conversation
    ? conversationViewerName(conversation, assignment?.agentId)
    : null;

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
        notesCount={notesCount}
        viewerName={viewerName}
        onBack={onBack}
      >
        <ConversationActions
          conversation={conversation}
          agents={agents}
          departments={departments}
          operator={operator}
          paused={paused}
          onChanged={refresh}
          onClosed={onClosed}
          onSchedule={() => setScheduleOpen(true)}
          onResume={() => void resume()}
          onFlash={(nextKind, text) =>
            nextKind === 'error' ? flashError(text) : flashSuccess(text)
          }
        />
      </ConversationThreadHeader>
      {show ? (
        <div className="px-3 pt-2">
          <CatalogSavedNotice show kind={kind} message={message} />
        </div>
      ) : null}
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
              ref={threadSearchRef}
              value={search}
              placeholder="Buscar na conversa"
              aria-label="Buscar na conversa"
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
              highlightQuery={search}
              onResend={(text) => void send({ text, file: null })}
              onReact={(messageId, emoji) => void react(messageId, emoji)}
              onReply={setReplyTo}
              bottomRef={bottomRef}
            />
          )}
        </div>
        {conversation ? (
          <div className="border-t border-border px-3 py-2">
            <TeamNotes
              conversationId={conversation.id}
              operator={operator}
              onCount={setNotesCount}
            />
          </div>
        ) : null}
        <MessageComposer
          sending={sending}
          error={error}
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
