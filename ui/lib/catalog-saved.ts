export const CATALOG_SAVED_NOTICE_MS = 3500;

export type CatalogActionFlash = {
  saving: boolean;
  show: boolean;
  kind: 'success' | 'error';
  message?: string;
};

export function catalogSavedNoticeVisible(
  savedAtMs: number | null,
  nowMs: number,
  ttlMs = CATALOG_SAVED_NOTICE_MS
): boolean {
  return savedAtMs != null && nowMs - savedAtMs < ttlMs;
}

export function catalogActionButtonLabel(
  idleLabel: string,
  flash: CatalogActionFlash,
  doneLabel?: string
): string {
  if (flash.saving) {
    return 'Salvando…';
  }
  if (flash.show && flash.kind === 'success') {
    if (doneLabel) {
      return flash.message === doneLabel ? doneLabel : idleLabel;
    }
    return 'Salvo';
  }
  return idleLabel;
}
