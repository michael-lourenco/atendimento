import { AxiosInstance } from 'axios';
import { SendMessageParams, WhatsAppMessageResponse } from '../../core/services/IWhatsAppService';
import { mediaKindFromMime, PlayableMediaType } from '../../core/services/IMediaStorage';

export type EvolutionMediaPost = {
  path: string;
  body: Record<string, unknown>;
};

export function evolutionSendEnvelope(
  toNumber: string,
  data: unknown
): WhatsAppMessageResponse {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const key = record.key && typeof record.key === 'object' ? (record.key as Record<string, unknown>) : {};
  const messageId =
    (typeof key.id === 'string' && key.id) ||
    (typeof record.messageId === 'string' && record.messageId) ||
    `evolution_${Date.now()}`;
  return {
    messaging_product: 'whatsapp',
    contacts: [{ input: toNumber, wa_id: toNumber }],
    messages: [{ id: messageId }],
  };
}

export function buildEvolutionMediaPost(
  instanceName: string,
  toNumber: string,
  params: SendMessageParams
): EvolutionMediaPost {
  if (!params.media) {
    throw new Error('Mídia ausente no envio Evolution');
  }
  const kind = mediaKindFromMime(params.media.mimeType);
  const base64 = Buffer.from(params.media.bytes).toString('base64');
  if (kind === 'audio') {
    return {
      path: `/message/sendWhatsAppAudio/${instanceName}`,
      body: {
        number: toNumber,
        audio: base64,
        encoding: true,
      },
    };
  }
  const caption = params.message.trim();
  return {
    path: `/message/sendMedia/${instanceName}`,
    body: {
      number: toNumber,
      mediatype: kind,
      mimetype: params.media.mimeType.split(';')[0],
      media: base64,
      fileName: params.media.fileName || defaultFileName(kind),
      ...(caption ? { caption } : {}),
    },
  };
}

export async function sendEvolutionMedia(
  client: AxiosInstance,
  instanceName: string,
  toNumber: string,
  params: SendMessageParams
): Promise<WhatsAppMessageResponse> {
  const post = buildEvolutionMediaPost(instanceName, toNumber, params);
  const response = await client.post(post.path, post.body, { timeout: 120000 });
  return evolutionSendEnvelope(toNumber, response.data);
}

function defaultFileName(kind: PlayableMediaType): string {
  if (kind === 'image') {
    return 'image.jpg';
  }
  if (kind === 'video') {
    return 'video.mp4';
  }
  return 'document.bin';
}
