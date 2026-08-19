import { ScheduledMessage } from './ScheduledMessage';
import { digitsPhone } from './conversationThread';

export function schedulesForConversation(
  items: ScheduledMessage[],
  conversation: { id: string; contactPhone: string }
): ScheduledMessage[] {
  const digits = digitsPhone(conversation.contactPhone);
  return items
    .filter((item) => {
      if (item.conversationId) {
        return item.conversationId === conversation.id;
      }
      return digitsPhone(item.contact) === digits;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
}
