import { Conversation } from './Conversation';

export function queuePlace(conversations: Conversation[], current: Conversation): number {
  const departmentId = current.departmentId;
  const waiting = conversations.filter(
    (item) =>
      item.status !== 'closed' &&
      !item.assignedAgentId &&
      (!departmentId || item.departmentId === departmentId)
  );
  const ordered = [...waiting].sort(
    (left, right) => left.lastActivity.getTime() - right.lastActivity.getTime()
  );
  const index = ordered.findIndex((item) => item.id === current.id);
  if (index < 0) {
    return waiting.length + 1;
  }
  return index + 1;
}

export function queuePlaceLine(place: number): string {
  return `Você é o ${place} na fila.`;
}
