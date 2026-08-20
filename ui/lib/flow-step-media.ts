import {
  MAX_OUTGOING_MEDIA_BYTES,
  flowStepMediaApiHref,
  flowStepStoragePathFromRef,
  mediaKindFromMime,
} from '@/core/services/IMediaStorage';

export function flowStepMediaFileError(file: File): string | null {
  if (file.size > MAX_OUTGOING_MEDIA_BYTES) {
    return 'Arquivo maior que 16 MB';
  }
  const kind = mediaKindFromMime(file.type || 'application/octet-stream');
  if (kind !== 'image' && kind !== 'audio') {
    return 'Só é permitido imagem ou áudio';
  }
  return null;
}

export function flowStepMediaPreviewSrc(
  flowId: string | undefined,
  stepId: string,
  mediaUrl?: string
): string | null {
  const url = mediaUrl?.trim();
  if (!url) {
    return null;
  }
  if (flowId && flowStepStoragePathFromRef(url)) {
    return flowStepMediaApiHref(flowId, stepId);
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return null;
}
