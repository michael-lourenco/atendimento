function errorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return '';
  }
  return String((error as { code: unknown }).code);
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const text = String((error as { message: unknown }).message).trim();
    if (text && text !== '[object Object]') {
      return text;
    }
  }
  return '';
}

export function catalogPersistErrorMessage(error: unknown, tableHint: string): string {
  const code = errorCode(error);
  if (code === 'PGRST205') {
    return `A tabela ${tableHint} ainda não existe no banco. Rode a migration correspondente no SQL Editor do Supabase.`;
  }
  if (code === 'PGRST204' && tableHint === 'flows') {
    return 'Falta a coluna keywords no banco. Rode 017_flow_editor_session.sql no SQL Editor do Supabase.';
  }
  if (code === 'PGRST204' && tableHint === 'scheduled_messages') {
    return 'Falta a coluna conversation_id no banco. Rode 010_schedule_conversation.sql no SQL Editor do Supabase.';
  }
  if (code === 'PGRST204') {
    return `Uma coluna ainda não existe em ${tableHint}. Rode a migration correspondente no SQL Editor do Supabase.`;
  }
  if (code === '23503' && tableHint === 'flows') {
    return 'Ainda há conversas usando este fluxo. Rode a migration 015_flow_delete_cascade.sql no SQL Editor e tente excluir de novo.';
  }
  if (code === '23503') {
    return 'Há registros ligados a este item. Não dá para excluir enquanto isso.';
  }
  const message = errorMessage(error);
  if (message) {
    return message;
  }
  return 'Não foi possível salvar.';
}
