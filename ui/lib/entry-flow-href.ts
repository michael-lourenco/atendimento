export function entryFlowSelectLink(flowId: string): { href: string; label: string } {
  const id = flowId.trim();
  if (!id) {
    return { href: '/dashboard/flows', label: 'Abrir Fluxos' };
  }
  return {
    href: `/dashboard/flows/${encodeURIComponent(id)}`,
    label: 'Editar este fluxo',
  };
}
