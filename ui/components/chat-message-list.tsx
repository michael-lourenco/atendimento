'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { Message } from '@/core/entities/Message';
import { formatInboxTime } from '@/core/entities/conversationInbox';
import { MessageMedia } from '@/ui/components/message-media';
import { MessageStatusTicks } from '@/ui/components/message-status-ticks';
import { MessageReactPicker, MessageReactionChips } from '@/ui/components/message-reactions';

type ChatMessageListProps = {
  messages: Message[];
  pendingSend: string | null;
  mineFrom: string;
  onResend: (text: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: Message) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function ChatMessageList({
  messages,
  pendingSend,
  mineFrom,
  onResend,
  onReact,
  onReply,
  bottomRef,
}: ChatMessageListProps) {
  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <ChatBubble
          key={message.id}
          message={message}
          mineFrom={mineFrom}
          onResend={onResend}
          onReact={(emoji) => onReact(message.id, emoji)}
          onReply={() => onReply(message)}
        />
      ))}
      {pendingSend ? (
        <div className="flex justify-end">
          <div className="max-w-[75%] rounded-2xl bg-bubble-out px-3 py-2 text-bubble-out-foreground shadow-sm">
            <p className="whitespace-pre-wrap break-words text-sm">{pendingSend}</p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
              <span>agora</span>
              <MessageStatusTicks message={{ direction: 'outgoing', status: 'pending' }} />
            </p>
          </div>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}

function ChatBubble({
  message,
  mineFrom,
  onResend,
  onReact,
  onReply,
}: {
  message: Message;
  mineFrom: string;
  onResend: (text: string) => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
}) {
  const incoming = message.direction === 'incoming';
  const [pickerOpen, setPickerOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  useEffect(() => () => clearPress(), []);

  const picker = (
    <MessageReactPicker
      incoming={incoming}
      open={pickerOpen}
      onOpenChange={setPickerOpen}
      onReact={onReact}
      onReply={onReply}
    />
  );

  return (
    <div
      className={`group flex items-end gap-1 ${incoming ? 'justify-start' : 'justify-end'}`}
      onContextMenu={(event) => {
        event.preventDefault();
        setPickerOpen(true);
      }}
      onTouchStart={() => {
        clearPress();
        pressTimer.current = setTimeout(() => setPickerOpen(true), 450);
      }}
      onTouchEnd={clearPress}
      onTouchMove={clearPress}
    >
      {incoming ? null : picker}
      <div className={`relative max-w-[75%] ${message.reactions?.length ? 'mb-3' : ''}`}>
        <div
          className={`rounded-2xl px-3 py-2 shadow-sm ${
            incoming
              ? 'bg-bubble-in text-bubble-in-foreground'
              : 'bg-bubble-out text-bubble-out-foreground'
          }`}
        >
          {message.quotedMessageId || message.quotedContent ? (
            <div className="mb-1 rounded-md border-l-2 border-primary/70 bg-black/5 px-2 py-1 dark:bg-white/10">
              <p className="truncate text-[11px] opacity-80">
                {message.quotedContent || 'Mensagem'}
              </p>
            </div>
          ) : null}
          <MessageMedia id={message.id} type={message.type} content={message.content} />
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
            <span>{formatInboxTime(message.timestamp)}</span>
            <MessageStatusTicks message={message} />
          </p>
          {!incoming && message.status === 'failed' ? (
            <button
              type="button"
              className="mt-1 text-[11px] underline opacity-80"
              onClick={() => onResend(message.content)}
            >
              Reenviar
            </button>
          ) : null}
        </div>
        <MessageReactionChips
          message={message}
          mineFrom={mineFrom}
          incoming={incoming}
          onReact={onReact}
        />
      </div>
      {incoming ? picker : null}
    </div>
  );
}
