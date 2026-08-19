import { Conversation } from './Conversation';
import { Department } from './Department';

export function conversationDisplayName(conversation: {
  contactName: string;
  contactPhone: string;
}): string {
  const name = conversation.contactName.trim();
  if (!name || name === conversation.contactPhone) {
    return conversation.contactPhone;
  }
  return name;
}

export function conversationPreview(conversation: Pick<Conversation, 'lastMessage'>): string {
  const content = conversation.lastMessage?.content?.trim();
  return content || 'Sem mensagens';
}

export function formatInboxTime(value: Date, now = new Date()): string {
  const date = value instanceof Date ? value : new Date(value);
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function departmentColorOf(departments: Department[], departmentId?: string): string | undefined {
  if (!departmentId) {
    return undefined;
  }
  return departments.find((item) => item.id === departmentId)?.color;
}
