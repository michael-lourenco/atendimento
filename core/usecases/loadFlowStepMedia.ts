import { OutgoingMedia } from '../services/IWhatsAppService';

const MAX_BYTES = 16 * 1024 * 1024;

export async function loadFlowStepMedia(
  url: string,
  kind: 'image' | 'audio'
): Promise<OutgoingMedia | null> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const response = await fetch(trimmed);
    if (!response.ok) {
      return null;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) {
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
