type SidebarNavProgressProps = {
  pending: boolean;
};

export function SidebarNavProgress({ pending }: SidebarNavProgressProps) {
  if (!pending) {
    return null;
  }
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-primary/20"
      role="status"
      aria-live="polite"
      aria-label="Carregando página"
    >
      <div className="h-full w-full animate-pulse bg-primary" />
    </div>
  );
}
