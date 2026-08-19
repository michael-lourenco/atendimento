import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import { lineHintFromMessage, matchWhatsAppNumber } from './whatsappNumberLine';

export function digitsPhone(phone: string): string {
  return phone.replace(/\D/g, '') || phone.trim();
}

export function conversationThreadId(phone: string, lineId?: string): string {
  const digits = digitsPhone(phone);
  const line = lineId?.trim();
  if (!line) {
    return digits;
  }
  return `${digits}:${line}`;
}

export function findConversationThread(
  conversations: Conversation[],
  phone: string,
  lineId?: string
): Conversation | undefined {
  const digits = digitsPhone(phone);
  const line = lineId?.trim();
  const composite = conversationThreadId(digits, line);
  const byId = conversations.find((item) => item.id === composite);
  if (byId) {
    return byId;
  }
  const samePhone = conversations.filter(
    (item) => digitsPhone(item.contactPhone) === digits
  );
  if (line) {
    return (
      samePhone.find((item) => item.whatsappNumberId === line) ??
      samePhone.find((item) => !item.whatsappNumberId && item.id === digits)
    );
  }
  return samePhone.find((item) => item.id === digits) ?? samePhone[0];
}

export function conversationFromInboxQuery(
  conversations: Conversation[],
  query: { conversationId?: string | null; contactPhone?: string | null }
): Conversation | undefined {
  const id = query.conversationId?.trim();
  if (id) {
    return conversations.find((item) => item.id === id);
  }
  const phone = query.contactPhone?.trim();
  if (!phone) {
    return undefined;
  }
  const digits = digitsPhone(phone);
  return [...conversations]
    .filter((item) => digitsPhone(item.contactPhone) === digits)
    .sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    )[0];
}

export function messageMatchesWhatsAppLine(
  message: Message,
  line: WhatsAppNumber
): boolean {
  return matchWhatsAppNumber([line], lineHintFromMessage(message))?.id === line.id;
}

export function messagesOnWhatsAppLine(
  messages: Message[],
  line: WhatsAppNumber | null | undefined
): Message[] {
  if (!line) {
    return messages;
  }
  return messages.filter((item) => messageMatchesWhatsAppLine(item, line));
}
