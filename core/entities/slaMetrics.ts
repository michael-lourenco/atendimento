import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';
import { digitsPhone, messagesOnWhatsAppLine } from './conversationThread';

export const UNASSIGNED_QUEUE_MINUTES = 5;

export function isHumanOutgoing(message: Message): boolean {
  return message.direction === 'outgoing' && !message.flowId && !message.stepId;
}

function messagesOfThread(
  messages: Message[],
  conversation: Conversation,
  numbers: WhatsAppNumber[]
): Message[] {
  const phone = digitsPhone(conversation.contactPhone);
  if (!phone) {
    return [];
  }
  const ofContact = messages.filter((item) => {
    const other = item.direction === 'incoming' ? item.from : item.to;
    const digits = digitsPhone(other);
    return digits === phone || item.from === conversation.contactPhone || item.to === conversation.contactPhone;
  });
  const line = numbers.find((item) => item.id === conversation.whatsappNumberId);
  return [...messagesOnWhatsAppLine(ofContact, line)].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export function firstHumanReplyMinutesFor(
  conversation: Conversation,
  messages: Message[],
  numbers: WhatsAppNumber[] = []
): number | null {
  const thread = messagesOfThread(messages, conversation, numbers);
  const firstIn = thread.find((item) => item.direction === 'incoming');
  if (!firstIn) {
    return null;
  }
  const firstInAt = new Date(firstIn.timestamp).getTime();
  const human = thread.find(
    (item) => isHumanOutgoing(item) && new Date(item.timestamp).getTime() >= firstInAt
  );
  if (!human) {
    return null;
  }
  return Math.max(0, Math.round((new Date(human.timestamp).getTime() - firstInAt) / 60000));
}

export function avgFirstHumanReplyMinutes(
  conversations: Conversation[],
  messages: Message[],
  numbers: WhatsAppNumber[] = []
): number | null {
  const samples = conversations
    .map((item) => firstHumanReplyMinutesFor(item, messages, numbers))
    .filter((value): value is number => value != null);
  if (samples.length === 0) {
    return null;
  }
  return Math.round(samples.reduce((sum, item) => sum + item, 0) / samples.length);
}

export function unassignedOlderThanMinutes(
  conversations: Conversation[],
  thresholdMinutes = UNASSIGNED_QUEUE_MINUTES,
  now = new Date()
): number {
  const cutoff = now.getTime() - thresholdMinutes * 60000;
  return conversations.filter((item) => {
    if (item.assignedAgentId) {
      return false;
    }
    if (item.status === 'closed') {
      return false;
    }
    return new Date(item.createdAt).getTime() <= cutoff;
  }).length;
}
