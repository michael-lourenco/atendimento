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
      className={
        error
          ? 'mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          : 'mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300'
      }
    >
      {message}
    </p>
  );
}
