type CatalogSavedNoticeProps = {
  show: boolean;
  kind?: 'success' | 'error';
  message?: string;
};

export function CatalogSavedNotice({
  show,
  kind = 'success',
  message = 'Salvo',
}: CatalogSavedNoticeProps) {
  if (!show) {
    return null;
  }
  const error = kind === 'error';
  return (
    <p
      role="status"
      aria-live="polite"
      className={
        error
          ? 'fixed left-1/2 top-20 z-50 w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm text-destructive shadow-lg'
          : 'fixed left-1/2 top-20 z-50 w-[min(calc(100%-2rem),24rem)] -translate-x-1/2 rounded-md border border-emerald-500/40 bg-card px-3 py-2 text-sm text-emerald-800 shadow-lg dark:text-emerald-300'
      }
    >
      {message}
    </p>
  );
}
