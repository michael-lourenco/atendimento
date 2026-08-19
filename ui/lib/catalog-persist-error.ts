export function catalogPersistErrorMessage(error: unknown, tableHint: string): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  if (code === 'PGRST205') {
    return `A tabela ${tableHint} ainda não existe no banco. Rode a migration correspondente no SQL Editor do Supabase.`;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Não foi possível salvar.';
}
