type CatalogSavedNoticeProps = {
  show: boolean;
};

export function CatalogSavedNotice({ show }: CatalogSavedNoticeProps) {
  if (!show) {
    return null;
  }
  return (
    <p
      role="status"
      className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300"
    >
      Salvo
    </p>
  );
}
