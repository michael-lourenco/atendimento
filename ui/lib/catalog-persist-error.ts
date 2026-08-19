export function catalogPersistErrorMessage(error: unknown, tableHint: string): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  if (code === 'PGRST205') {
    return `A tabela ${tableHint} ainda não existe no banco. Rode a migration correspondente no SQL Editor do Supabase.`;
  }
  if (code === '23503' && tableHint === 'flows') {
    return 'Ainda há conversas usando este fluxo. Rode a migration 015_flow_delete_cascade.sql no SQL Editor e tente excluir de novo.';
  }
  if (code === '23503') {
    return 'Há registros ligados a este item. Não dá para excluir enquanto isso.';
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Não foi possível salvar.';
}
