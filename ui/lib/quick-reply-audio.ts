import { MAX_OUTGOING_MEDIA_BYTES, isAllowedQuickReplyMime, isPdfMime, quickReplyMediaApiHref } from '@/core/services/IMediaStorage';

export function mimeOfFile(file: File): string {
  if (file.type) {
    return file.type;
  }
  if (file.name.toLowerCase().endsWith('.pdf')) {
    return 'application/pdf';
  }
  return '';
}

export function quickReplyMediaFileError(file: File): string | null {
  if (file.size > MAX_OUTGOING_MEDIA_BYTES) {
    return 'Arquivo maior que 16 MB';
  }
  const mime = mimeOfFile(file);
  if (mime && !isAllowedQuickReplyMime(mime)) {
    return 'Só é permitido imagem, vídeo, áudio ou PDF';
  }
  return null;
}

function extensionForMime(mimeType: string): string {
  const mime = mimeType.split(';')[0].trim().toLowerCase();
  if (isPdfMime(mime)) {
    return 'pdf';
  }
  if (mime === 'image/png') {
    return 'png';
  }
  if (mime === 'image/webp') {
    return 'webp';
  }
  if (mime === 'image/gif') {
    return 'gif';
  }
  if (mime.startsWith('image/')) {
    return 'jpg';
  }
  if (mime === 'video/webm' || mime.includes('webm')) {
    return 'webm';
  }
  if (mime.startsWith('video/')) {
    return 'mp4';
  }
  if (mime.includes('ogg')) {
    return 'ogg';
  }
  if (mime.includes('mpeg') || mime.includes('mp3')) {
    return 'mp3';
  }
  return 'bin';
}

export async function fetchQuickReplyMediaFile(id: string): Promise<File | null> {
  const response = await fetch(quickReplyMediaApiHref(id));
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  if (blob.size === 0) {
    return null;
  }
  const type = blob.type || 'application/octet-stream';
  return new File([blob], `quick-reply.${extensionForMime(type)}`, { type });
}
