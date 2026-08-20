import { Conversation } from './Conversation';
import { Message, MessageStatus } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import { digitsPhone, messagesOnWhatsAppLine } from './conversationThread';

function contactPhoneOf(message: Message): string {
  const phone = message.direction === 'incoming' ? message.from : message.to;
  return digitsPhone(phone) || phone;
}

export function messagesForConversation(
  messages: Message[],
  conversation: Conversation,
  line?: WhatsAppNumber | null
): Message[] {
  const phone = digitsPhone(conversation.contactPhone);
  if (!phone) {
    return [];
  }
  const ofContact = messages.filter((item) => {
    const other = contactPhoneOf(item);
    return (
      other === phone ||
      item.from === conversation.contactPhone ||
      item.to === conversation.contactPhone
    );
  });
  return messagesOnWhatsAppLine(ofContact, line);
}

export function lastMessageForConversation(
  messages: Message[],
  conversation: Conversation,
  line?: WhatsAppNumber | null
): Message | undefined {
  const onLine = messagesForConversation(messages, conversation, line);
  return [...onLine].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
}

export function conversationMatchesMessageText(
  conversation: Conversation,
  query: string,
  messages: Message[] = [],
  numbers: WhatsAppNumber[] = []
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  if (conversation.lastMessage?.content.toLowerCase().includes(needle)) {
    return true;
  }
  const line = numbers.find((item) => item.id === conversation.whatsappNumberId);
  return messagesForConversation(messages, conversation, line).some((item) =>
    item.content.toLowerCase().includes(needle)
  );
}

export function attachMissingLastMessages(
  conversations: Conversation[],
  messages: Message[],
  numbers: WhatsAppNumber[]
): Conversation[] {
  return conversations.map((conversation) => {
    if (conversation.lastMessage) {
      return conversation;
    }
    const line = numbers.find((item) => item.id === conversation.whatsappNumberId);
    const last = lastMessageForConversation(messages, conversation, line);
    return last ? { ...conversation, lastMessage: last } : conversation;
  });
}

export function applyLastMessageStatus(
  conversation: Conversation,
  messageId: string,
  status: MessageStatus
): Conversation | null {
  if (!conversation.lastMessage || conversation.lastMessage.id !== messageId) {
    return null;
  }
  return {
    ...conversation,
    lastMessage: { ...conversation.lastMessage, status },
  };
}
