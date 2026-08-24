import {
  MAX_OUTGOING_MEDIA_BYTES,
  flowStepMediaApiHref,
  flowStepStoragePathFromRef,
  isAllowedQuickReplyMime,
} from '@/core/services/IMediaStorage';

export function mimeOfFlowStepFile(file: File): string {
  if (file.type) {
    return file.type;
  }
  if (file.name.toLowerCase().endsWith('.pdf')) {
    return 'application/pdf';
  }
  return 'application/octet-stream';
}

export function flowStepMediaFileError(file: File): string | null {
  if (file.size > MAX_OUTGOING_MEDIA_BYTES) {
    return 'Arquivo maior que 16 MB';
  }
  if (!isAllowedQuickReplyMime(mimeOfFlowStepFile(file))) {
    return 'Só é permitido imagem, vídeo, áudio ou PDF';
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
