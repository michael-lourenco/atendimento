import { MAX_OUTGOING_MEDIA_BYTES, quickReplyMediaApiHref } from '@/core/services/IMediaStorage';

export function quickReplyAudioFileError(file: File): string | null {
  if (file.size > MAX_OUTGOING_MEDIA_BYTES) {
    return 'Arquivo maior que 16 MB';
  }
  if (file.type && !file.type.startsWith('audio/')) {
    return 'Só é permitido áudio';
  }
  return null;
}

export async function fetchQuickReplyAudioFile(id: string): Promise<File | null> {
  const response = await fetch(quickReplyMediaApiHref(id));
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  if (blob.size === 0) {
    return null;
  }
  const type = blob.type || 'audio/ogg';
  const ext = type.includes('ogg') ? 'ogg' : type.includes('webm') ? 'webm' : 'audio';
  return new File([blob], `quick-reply.${ext}`, { type });
}
