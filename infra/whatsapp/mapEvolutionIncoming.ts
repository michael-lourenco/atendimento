import { Message } from '../../core/entities/Message';
import { evolutionAckToStatus } from '../../core/entities/messageStatus';
import { isDirectContactJid } from './isDirectContactJid';
import { normalizeEvolutionEvent } from './mapEvolutionStatus';

function asItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.messages)) {
      return record.messages.filter((item) => item && typeof item === 'object') as Record<
        string,
        unknown
      >[];
    }
    if (record.data && typeof record.data === 'object' && !record.key) {
      return asItems(record.data);
    }
    return [record];
  }
  return [];
}

function readPushName(item: Record<string, unknown>): string | undefined {
  const candidates = [item.pushName, item.pushname, item.verifiedBizName];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readContent(message: Record<string, unknown>): {
  content: string;
  type: Message['type'];
} {
  const extended = message.extendedTextMessage as { text?: string } | undefined;
  if (typeof message.conversation === 'string' || extended?.text) {
    return {
      content: String(message.conversation || extended?.text || ''),
      type: 'text',
    };
  }
  if (message.imageMessage) {
    const image = message.imageMessage as { caption?: string };
    return { content: image.caption || 'Imagem recebida', type: 'image' };
  }
  if (message.audioMessage) {
    return { content: 'Áudio recebido', type: 'audio' };
  }
  if (message.videoMessage) {
    const video = message.videoMessage as { caption?: string };
    return { content: video.caption || 'Vídeo recebido', type: 'video' };
  }
  if (message.documentMessage) {
    const document = message.documentMessage as { caption?: string; fileName?: string };
    return {
      content: document.caption || document.fileName || 'Documento recebido',
      type: 'document',
    };
  }
  return { content: '', type: 'text' };
}

export function mapEvolutionIncomingMessages(
  payload: { event?: string; data?: unknown },
  instanceName: string
): Message[] {
  if (normalizeEvolutionEvent(payload.event) !== 'messages.upsert') {
    return [];
  }

  const mapped: Message[] = [];
  for (const item of asItems(payload.data)) {
    const key = item.key as Record<string, unknown> | undefined;
    const message = item.message as Record<string, unknown> | undefined;
    if (!key || !message) {
      continue;
    }
    const fromMe =
      key.fromMe === true ||
      key.fromMe === 'true' ||
      item.fromMe === true ||
      item.fromMe === 'true';
    const remoteJid = typeof key.remoteJid === 'string' ? key.remoteJid : '';
    if (!isDirectContactJid(remoteJid)) {
      continue;
    }

    const contactPhone = remoteJid.split('@')[0] || '';
    const { content, type } = readContent(message);
    const timestampValue = item.messageTimestamp;
    const timestamp =
      typeof timestampValue === 'number'
        ? new Date(timestampValue * 1000)
        : new Date(Number(timestampValue || Date.now()) * 1000);

    mapped.push({
      id: String(key.id || `evolution_${Date.now()}`),
      from: fromMe ? instanceName : contactPhone,
      to: fromMe ? contactPhone : instanceName,
      content,
      type,
      timestamp,
      direction: fromMe ? 'outgoing' : 'incoming',
      status: fromMe
        ? evolutionAckToStatus(item.status ?? item.ack) ?? 'sent'
        : 'delivered',
      contactName: fromMe ? undefined : readPushName(item),
    });
  }
  return mapped;
}

export function listEvolutionWebhookItems(payload: {
  event?: string;
  data?: unknown;
}): Record<string, unknown>[] {
  if (normalizeEvolutionEvent(payload.event) !== 'messages.upsert') {
    return [];
  }
  return asItems(payload.data);
}
