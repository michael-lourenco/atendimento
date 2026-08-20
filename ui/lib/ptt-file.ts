export const PTT_MIN_MS = 400;
export const PTT_MAX_MS = 60_000;

export function canRecordPtt(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function pickPttMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  const candidates = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm'];
  return candidates.find((item) => MediaRecorder.isTypeSupported(item)) ?? '';
}

export function pttFileFromBlobs(chunks: Blob[], mimeType: string): File {
  const type = mimeType.split(';')[0] || 'audio/webm';
  const blob = new Blob(chunks, { type });
  const ext = type.includes('ogg') ? 'ogg' : 'webm';
  return new File([blob], `ptt.${ext}`, { type });
}
