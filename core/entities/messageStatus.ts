import { Message, MessageStatus } from './Message';

const RANK: Record<MessageStatus, number> = {
  failed: -1,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

export type WhatsAppTickKind = 'clock' | 'sent' | 'delivered' | 'read' | 'failed';

export function mergeMessageStatus(
  current: MessageStatus | undefined,
  next: MessageStatus
): MessageStatus {
  if (!current) return next;
  if (next === 'failed') {
    return current === 'delivered' || current === 'read' ? current : 'failed';
  }
  if (current === 'failed') return next;
  return RANK[next] >= RANK[current] ? next : current;
}

export function evolutionAckToStatus(raw: unknown): MessageStatus | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw <= 0) return 'failed';
    if (raw === 1) return 'pending';
    if (raw === 2) return 'sent';
    if (raw === 3) return 'delivered';
    if (raw >= 4) return 'read';
  }
  const value = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/-/g, '_');
  if (!value) return null;
  if (value === 'ERROR' || value === 'FAILED') return 'failed';
  if (value === 'PENDING' || value === 'CLOCK') return 'pending';
  if (value === 'SERVER_ACK' || value === 'SENT') return 'sent';
  if (value === 'DELIVERY_ACK' || value === 'DELIVERED') return 'delivered';
  if (value === 'READ' || value === 'PLAYED') return 'read';
  return null;
}

export function whatsappTickKind(message: Pick<Message, 'direction' | 'status'>): WhatsAppTickKind | null {
  if (message.direction !== 'outgoing') return null;
  if (message.status === 'pending') return 'clock';
  if (message.status === 'sent') return 'sent';
  if (message.status === 'delivered') return 'delivered';
  if (message.status === 'read') return 'read';
  return 'failed';
}

export const WHATSAPP_TICK_LABEL: Record<WhatsAppTickKind, string> = {
  clock: 'Enviando',
  sent: 'Enviada',
  delivered: 'Entregue',
  read: 'Lida',
  failed: 'Falhou',
};
