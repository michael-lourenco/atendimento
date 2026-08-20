export type ConversationThreadBody = 'loading' | 'empty' | 'messages';

export function conversationThreadBody(input: {
  ready: boolean;
  messageCount: number;
  hasPending: boolean;
}): ConversationThreadBody {
  if (!input.ready) {
    return 'loading';
  }
  if (input.messageCount === 0 && !input.hasPending) {
    return 'empty';
  }
  return 'messages';
}
