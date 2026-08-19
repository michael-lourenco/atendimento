export function InboxSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-[520px] flex-col gap-3" aria-busy="true">
      <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(260px,340px)_1fr]">
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="h-9 animate-pulse rounded-md bg-muted" />
          <div className="h-9 animate-pulse rounded-md bg-muted" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-md border border-border p-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="hidden rounded-lg border border-dashed border-border bg-card lg:block">
          <div className="h-full animate-pulse bg-muted/40" />
        </div>
      </div>
    </div>
  );
}
