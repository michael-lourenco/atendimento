import { OutgoingMedia } from '../services/IWhatsAppService';
import { FlowStepMediaKind } from '../entities/Flow';
import {
  IMediaStorage,
  MAX_OUTGOING_MEDIA_BYTES,
  flowStepStoragePathFromRef,
} from '../services/IMediaStorage';

function fallbackMime(kind: FlowStepMediaKind): string {
  if (kind === 'audio') {
    return 'audio/ogg';
  }
  if (kind === 'video') {
    return 'video/mp4';
  }
  if (kind === 'document') {
    return 'application/pdf';
  }
  return 'image/jpeg';
}

function fallbackFileName(kind: FlowStepMediaKind): string {
  if (kind === 'audio') {
    return 'audio.ogg';
  }
  if (kind === 'video') {
    return 'video.mp4';
  }
  if (kind === 'document') {
    return 'file.pdf';
  }
  return 'image.jpg';
}

export async function loadFlowStepMedia(
  url: string,
  kind: FlowStepMediaKind,
  storage?: IMediaStorage | null
): Promise<OutgoingMedia | null> {
  const trimmed = url.trim();
  const storedPath = flowStepStoragePathFromRef(trimmed);
  if (storedPath) {
    if (!storage) {
      return null;
    }
    try {
      const file = await storage.get(storedPath);
      if (!file || file.bytes.byteLength === 0 || file.bytes.byteLength > MAX_OUTGOING_MEDIA_BYTES) {
        return null;
      }
      const mimeType = file.mimeType || fallbackMime(kind);
      return {
        mimeType,
        fileName: fallbackFileName(kind),
        bytes: file.bytes,
      };
    } catch {
      return null;
    }
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const response = await fetch(trimmed);
    if (!response.ok) {
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_OUTGOING_MEDIA_BYTES) {
      return null;
    }
    const header = response.headers.get('content-type')?.split(';')[0]?.trim();
    const mimeType = header || fallbackMime(kind);
    const fileName = trimmed.split('/').pop()?.split('?')[0] || fallbackFileName(kind);
    return { mimeType, fileName, bytes };
  } catch {
    return null;
  }
}
