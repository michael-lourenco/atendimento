export type StoredMedia = {
  bytes: Uint8Array;
  mimeType: string;
};

export interface IMediaStorage {
  save(path: string, media: StoredMedia): Promise<void>;
  get(path: string): Promise<StoredMedia | null>;
  remove(path: string): Promise<void>;
}

export function messageMediaPath(messageId: string): string {
  return `messages/${messageId}`;
}

export function contactAvatarPath(contactId: string): string {
  return `contacts/${contactId}`;
}

export function contactAvatarApiHref(contactId: string): string {
  return `/api/contacts/${encodeURIComponent(contactId)}/avatar`;
}

export function quickReplyMediaPath(quickReplyId: string): string {
  return `quick-replies/${quickReplyId}`;
}

export function quickReplyMediaApiHref(quickReplyId: string): string {
  return `/api/quick-replies/${encodeURIComponent(quickReplyId)}/media`;
}

export function flowStepMediaPath(flowId: string, stepId: string): string {
  return `flows/${flowId}/${stepId}`;
}

export function flowStepMediaApiHref(flowId: string, stepId: string): string {
  return `/api/flows/${encodeURIComponent(flowId)}/steps/${encodeURIComponent(stepId)}/media`;
}

export function flowStepStoragePathFromRef(url: string): string | null {
  const trimmed = url.trim();
  const stored = trimmed.match(/^flows\/([^/]+)\/([^/]+)$/);
  if (stored) {
    return trimmed;
  }
  const href = trimmed.match(/^\/api\/flows\/([^/]+)\/steps\/([^/]+)\/media(?:\?.*)?$/);
  if (href) {
    return flowStepMediaPath(decodeURIComponent(href[1]), decodeURIComponent(href[2]));
  }
  return null;
}

export function isValidFlowStepMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return true;
  }
  return flowStepStoragePathFromRef(trimmed) !== null;
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
