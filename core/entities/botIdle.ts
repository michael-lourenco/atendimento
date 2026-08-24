import { Conversation } from './Conversation';
import { Message } from './Message';

export function lastIncomingTimestamp(
  conversation: Conversation,
  messages: Message[]
): Date | null {
  const incoming = messages
    .filter((item) => item.direction === 'incoming')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (incoming[0]) {
    return new Date(incoming[0].timestamp);
  }
  if (conversation.lastMessage?.direction === 'incoming') {
    return new Date(conversation.lastMessage.timestamp);
  }
  return null;
}

function incomingTexts(messages: Message[]): Message[] {
  return messages
    .filter((item) => item.direction === 'incoming' && item.type === 'text' && item.content.trim())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function latestIncomingText(messages: Message[], fallback: string): string {
  return incomingTexts(messages)[0]?.content.trim() ?? fallback;
}

export function latestIncomingAt(messages: Message[], fallback: Date): Date {
  const stamp = incomingTexts(messages)[0]?.timestamp;
  return stamp ? new Date(stamp) : fallback;
}

export function isBotIdleQuestion(session: {
  paused: boolean;
  currentStepId: string | null;
}): boolean {
  return !session.paused && Boolean(session.currentStepId);
}
