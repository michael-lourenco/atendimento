type CatalogListSkeletonProps = {
  rows?: number;
};

export function CatalogListSkeleton({ rows = 6 }: CatalogListSkeletonProps) {
  return (
    <div className="space-y-3 py-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
