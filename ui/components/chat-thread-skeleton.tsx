export function ChatThreadSkeleton() {
  return (
    <div className="space-y-3 py-6" aria-busy="true" aria-live="polite">
      <p className="text-center text-sm text-muted-foreground">Carregando</p>
      <div className="flex justify-start">
        <div className="h-12 w-2/5 max-w-[75%] animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="flex justify-end">
        <div className="h-12 w-1/2 max-w-[75%] animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="flex justify-start">
        <div className="h-16 w-1/3 max-w-[75%] animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
