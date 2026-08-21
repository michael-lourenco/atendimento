import { Conversation } from '@/core/entities/Conversation';
import { Message } from '@/core/entities/Message';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { conversationDisplayName } from '@/core/entities/conversationInbox';
import { historyContactPhone, historyThreadForMessage } from '@/core/entities/historyThread';
import { inboxHrefForContactPhone, inboxHrefForConversation } from '@/ui/lib/inbox-href';

export function historyHrefForMessage(
  message: Message,
  conversations: Conversation[],
  numbers: WhatsAppNumber[] = []
): string {
  const thread = historyThreadForMessage(message, conversations, numbers);
  if (thread) {
    return inboxHrefForConversation(thread.id);
  }
  return inboxHrefForContactPhone(historyContactPhone(message));
}

export function historyContactLabel(
  message: Message,
  conversations: Conversation[],
  numbers: WhatsAppNumber[] = []
): string {
  const thread = historyThreadForMessage(message, conversations, numbers);
  if (thread) {
    return conversationDisplayName(thread);
  }
  return historyContactPhone(message);
}
