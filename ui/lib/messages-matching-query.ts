import { Message } from '@/core/entities/Message';

export function messagesMatchingQuery(messages: Message[], query: string): Message[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return messages;
  }
  return messages.filter((message) => message.content.toLowerCase().includes(needle));
}
