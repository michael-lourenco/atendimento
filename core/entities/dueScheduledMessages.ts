import { ScheduledMessage } from './ScheduledMessage';

export function dueScheduledMessages(
  items: ScheduledMessage[],
  now = new Date()
): ScheduledMessage[] {
  const nowMs = now.getTime();
  return items
    .filter(
      (item) => item.status === 'pending' && new Date(item.scheduledDate).getTime() <= nowMs
    )
    .sort(
      (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
}
