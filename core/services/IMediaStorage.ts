export type StoredMedia = {
  bytes: Uint8Array;
  mimeType: string;
};

export interface IMediaStorage {
  save(path: string, media: StoredMedia): Promise<void>;
  get(path: string): Promise<StoredMedia | null>;
}

export function messageMediaPath(messageId: string): string {
  return `messages/${messageId}`;
}

export function isPlayableMediaType(type: string): boolean {
  return type === 'image' || type === 'audio' || type === 'video' || type === 'document';
}

export type PlayableMediaType = 'image' | 'audio' | 'video' | 'document';

export const MAX_OUTGOING_MEDIA_BYTES = 16 * 1024 * 1024;

export function mediaKindFromMime(mimeType: string): PlayableMediaType {
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (mime.startsWith('image/')) {
    return 'image';
  }
  if (mime.startsWith('audio/')) {
    return 'audio';
  }
  if (mime.startsWith('video/')) {
    return 'video';
  }
  return 'document';
}

export function defaultOutgoingCaption(kind: PlayableMediaType): string {
  if (kind === 'image') {
    return 'Imagem enviada';
  }
  if (kind === 'audio') {
    return 'Áudio enviado';
  }
  if (kind === 'video') {
    return 'Vídeo enviado';
  }
  return 'Documento enviado';
}
