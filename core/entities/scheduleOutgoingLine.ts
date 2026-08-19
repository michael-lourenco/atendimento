import { Conversation } from './Conversation';
import { ScheduledMessage } from './ScheduledMessage';
import { WhatsAppNumber } from './WhatsAppNumber';
import { conversationFromInboxQuery } from './conversationThread';
import { lineNameOf } from './whatsappNumberLine';

export function scheduleOutgoingLineName(
  schedule: Pick<ScheduledMessage, 'contact' | 'conversationId'>,
  conversations: Conversation[],
  numbers: WhatsAppNumber[]
): string {
  const conversation = schedule.conversationId
    ? conversations.find((item) => item.id === schedule.conversationId)
    : conversationFromInboxQuery(conversations, { contactPhone: schedule.contact });
  return lineNameOf(numbers, conversation) || '—';
}
