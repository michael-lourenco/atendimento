export const CATALOG_SAVED_NOTICE_MS = 3500;

export function catalogSavedNoticeVisible(
  savedAtMs: number | null,
  nowMs: number,
  ttlMs = CATALOG_SAVED_NOTICE_MS
): boolean {
  return savedAtMs != null && nowMs - savedAtMs < ttlMs;
}
