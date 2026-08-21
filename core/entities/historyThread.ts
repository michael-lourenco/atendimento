import { Message } from './Message';
import { Conversation } from './Conversation';
import { WhatsAppNumber } from './WhatsAppNumber';
import { digitsPhone, findConversationThread } from './conversationThread';
import { lineHintFromMessage, matchWhatsAppNumber } from './whatsappNumberLine';

export function historyContactPhone(message: Message): string {
  const raw = message.direction === 'incoming' ? message.from : message.to;
  return digitsPhone(raw) || raw.trim();
}

export function historyThreadForMessage(
  message: Message,
  conversations: Conversation[],
  numbers: WhatsAppNumber[] = []
): Conversation | undefined {
  const phone = historyContactPhone(message);
  const line = matchWhatsAppNumber(numbers, lineHintFromMessage(message));
  return findConversationThread(conversations, phone, line?.id);
}

export function historyStatusLabel(message: Pick<Message, 'direction' | 'status'>): string {
  if (message.direction === 'incoming') {
    return 'Recebida';
  }
  if (message.status === 'pending') {
    return 'Enviando';
  }
  if (message.status === 'sent') {
    return 'Enviada';
  }
  if (message.status === 'delivered') {
    return 'Entregue';
  }
  if (message.status === 'read') {
    return 'Lida';
  }
  return 'Falhou';
}

export function historyTypeLabel(type: Message['type']): string {
  if (type === 'image') {
    return 'Imagem';
  }
  if (type === 'audio') {
    return 'Áudio';
  }
  if (type === 'video') {
    return 'Vídeo';
  }
  if (type === 'document') {
    return 'Documento';
  }
  return 'Texto';
}
