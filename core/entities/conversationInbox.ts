import { Conversation } from './Conversation';
import { Department } from './Department';
import { Message } from './Message';

export function conversationAvatarLetter(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export function conversationPhotoUrl(conversation: { contactAvatarUrl?: string }): string | undefined {
  const url = conversation.contactAvatarUrl?.trim();
  return url || undefined;
}

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

const MEDIA_PREVIEW: Record<string, string> = {
  image: 'Foto',
  audio: 'Áudio',
  video: 'Vídeo',
  document: 'Documento',
};

function isGenericMediaCaption(text: string): boolean {
  return /^(imagem|áudio|audio|vídeo|video|documento)\s+(enviad[oa]|recebid[oa])$/i.test(text);
}

function previewBody(message: Message): string {
  const text = message.content?.trim() ?? '';
  if (message.type === 'audio') {
    return 'Áudio';
  }
  if (message.type === 'image' || message.type === 'video' || message.type === 'document') {
    if (text && !isGenericMediaCaption(text)) {
      return text;
    }
    return MEDIA_PREVIEW[message.type];
  }
  return text;
}

export const CONTACT_TYPING_TTL_MS = 12_000;

export function conversationIsTyping(
  conversation: Pick<Conversation, 'contactTypingAt'>,
  now = new Date()
): boolean {
  const at = conversation.contactTypingAt;
  if (!at) {
    return false;
  }
  const stamp = at instanceof Date ? at : new Date(at);
  return now.getTime() - stamp.getTime() <= CONTACT_TYPING_TTL_MS;
}

export function conversationPreview(
  conversation: Pick<Conversation, 'lastMessage' | 'contactTypingAt'>,
  now = new Date()
): string {
  if (conversationIsTyping(conversation, now)) {
    return 'digitando…';
  }
  const message = conversation.lastMessage;
  if (!message) {
    return 'Sem mensagens';
  }
  const body = previewBody(message);
  if (!body) {
    return 'Sem mensagens';
  }
  return message.direction === 'outgoing' ? `Você: ${body}` : body;
}

export function conversationPreviewIsOutgoing(
  conversation: Pick<Conversation, 'lastMessage' | 'contactTypingAt'>,
  now = new Date()
): boolean {
  if (conversationIsTyping(conversation, now)) {
    return false;
  }
  return conversation.lastMessage?.direction === 'outgoing';
}

export function conversationPreviewFailed(
  conversation: Pick<Conversation, 'lastMessage' | 'contactTypingAt'>,
  now = new Date()
): boolean {
  if (!conversationPreviewIsOutgoing(conversation, now)) {
    return false;
  }
  return conversation.lastMessage?.status === 'failed';
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
