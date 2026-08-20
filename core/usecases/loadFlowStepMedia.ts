import { OutgoingMedia } from '../services/IWhatsAppService';
import {
  IMediaStorage,
  MAX_OUTGOING_MEDIA_BYTES,
  flowStepStoragePathFromRef,
} from '../services/IMediaStorage';

export async function loadFlowStepMedia(
  url: string,
  kind: 'image' | 'audio',
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
      const mimeType = file.mimeType || (kind === 'audio' ? 'audio/ogg' : 'image/jpeg');
      return {
        mimeType,
        fileName: kind === 'audio' ? 'audio.ogg' : 'image.jpg',
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
    const mimeType = header || (kind === 'audio' ? 'audio/ogg' : 'image/jpeg');
    const fileName =
      trimmed.split('/').pop()?.split('?')[0] || (kind === 'audio' ? 'audio.ogg' : 'image.jpg');
    return { mimeType, fileName, bytes };
  } catch {
    return null;
  }
}
