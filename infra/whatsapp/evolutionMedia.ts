import { Message } from '../../core/entities/Message';
import { mediaLookupFromMessage } from '../../core/entities/messageMediaLookup';
import { IMediaStorage, isPlayableMediaType, messageMediaPath } from '../../core/services/IMediaStorage';
import { listEvolutionWebhookItems } from './mapEvolutionIncoming';

export type DownloadedMedia = {
  bytes: Uint8Array;
  mimeType: string;
};

export function parseEvolutionMediaResponse(data: unknown): DownloadedMedia | null {
  if (typeof data === 'string' && data.length > 20) {
    return { bytes: decodeBase64(data), mimeType: 'application/octet-stream' };
  }
  if (!data || typeof data !== 'object') {
    return null;
  }
  const record = data as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === 'object'
      ? (record.data as Record<string, unknown>)
      : record;
  const raw = nested.base64 ?? nested.base64Data;
  if (typeof raw !== 'string' || raw.length < 20) {
    return null;
  }
  const mimeCandidate = nested.mimetype ?? nested.mimeType ?? nested.mediaType;
  const mimeType = normalizeMediaMime(mimeCandidate, nested.fileName);
  return { bytes: decodeBase64(raw), mimeType };
}

function decodeBase64(raw: string): Uint8Array {
  const cleaned = raw.replace(/^data:[^;]+;base64,/, '');
  return new Uint8Array(Buffer.from(cleaned, 'base64'));
}

function normalizeMediaMime(value: unknown, fileName: unknown): string {
  if (typeof value === 'string' && value.includes('/')) {
    return value.split(';')[0];
  }
  if (value === 'imageMessage' || value === 'image') {
    return 'image/jpeg';
  }
  if (value === 'audioMessage' || value === 'audio' || value === 'ptt') {
    return 'audio/ogg';
  }
  if (value === 'videoMessage' || value === 'video') {
    return 'video/mp4';
  }
  if (typeof fileName === 'string' && fileName.toLowerCase().endsWith('.pdf')) {
    return 'application/pdf';
  }
  return 'application/octet-stream';
}

export async function hydrateEvolutionMedia(params: {
  payload: { event?: string; data?: unknown };
  messages: Message[];
  download: (input: {
    messageId: string;
    webhookItem?: Record<string, unknown>;
    convertToMp4?: boolean;
  }) => Promise<DownloadedMedia | null>;
  storage: IMediaStorage;
}): Promise<void> {
  const byId = new Map(params.messages.map((message) => [message.id, message]));
  for (const item of listEvolutionWebhookItems(params.payload)) {
    const key = item.key as Record<string, unknown> | undefined;
    const messageId = typeof key?.id === 'string' ? key.id : '';
    const message = byId.get(messageId);
    if (!message || !isPlayableMediaType(message.type)) {
      continue;
    }
    const path = messageMediaPath(message.id);
    if (await params.storage.get(path)) {
      continue;
    }
    try {
      const file = await params.download({
        messageId: message.id,
        webhookItem: item,
        convertToMp4: message.type === 'video',
      });
      if (file) {
        await params.storage.save(path, file);
      }
    } catch {
      console.error('Falha ao cachear mídia Evolution');
    }
  }
}

export { mediaLookupFromMessage };

export async function resolvePlayableMedia(params: {
  message: Message;
  storage: IMediaStorage;
  download?: (input: {
    messageId: string;
    convertToMp4?: boolean;
    remoteJid?: string;
    fromMe?: boolean;
  }) => Promise<DownloadedMedia | null>;
}): Promise<DownloadedMedia | null> {
  if (!isPlayableMediaType(params.message.type)) {
    return null;
  }
  const path = messageMediaPath(params.message.id);
  const cached = await params.storage.get(path);
  if (cached) {
    return cached;
  }
  if (!params.download) {
    return null;
  }
  try {
    const lookup = mediaLookupFromMessage(params.message);
    const file = await params.download({
      messageId: params.message.id,
      convertToMp4: params.message.type === 'video',
      remoteJid: lookup.remoteJid,
      fromMe: lookup.fromMe,
    });
    if (file) {
      try {
        await params.storage.save(path, file);
      } catch {
        console.error('Falha ao cachear mídia');
      }
    }
    return file;
  } catch {
    console.error('Falha ao obter mídia');
    return null;
  }
}
