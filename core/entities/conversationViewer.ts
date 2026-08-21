import { Conversation } from './Conversation';

export const CONVERSATION_VIEWER_TTL_MS = 20_000;

export function conversationViewerName(
  conversation: Pick<Conversation, 'viewerAgentId' | 'viewerAgentName' | 'viewerAt'>,
  myAgentId?: string,
  now = new Date()
): string | null {
  if (!conversation.viewerAgentId || !conversation.viewerAt) {
    return null;
  }
  if (myAgentId && conversation.viewerAgentId === myAgentId) {
    return null;
  }
  const age = now.getTime() - new Date(conversation.viewerAt).getTime();
  if (age > CONVERSATION_VIEWER_TTL_MS) {
    return null;
  }
  const name = conversation.viewerAgentName?.trim();
  return name || 'Alguém';
}
