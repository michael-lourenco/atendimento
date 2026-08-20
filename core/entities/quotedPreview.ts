export const QUOTED_PREVIEW_MAX = 200;

export function quotedPreview(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= QUOTED_PREVIEW_MAX) {
    return trimmed;
  }
  return trimmed.slice(0, QUOTED_PREVIEW_MAX);
}
