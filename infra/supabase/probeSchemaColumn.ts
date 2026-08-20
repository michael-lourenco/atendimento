import { SupabaseClient } from '@supabase/supabase-js';
import { isMissingColumnError } from './missingColumn';

export function isMissingTableError(error: unknown, table: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message).toLowerCase() : '';
  const needle = table.toLowerCase();
  if (code === 'PGRST205') {
    return true;
  }
  return message.includes(needle) && (message.includes('schema cache') || message.includes('could not find'));
}

export async function probeSchemaColumn(
  client: SupabaseClient,
  table: string,
  column: string
): Promise<boolean> {
  const { error } = await client.from(table).select(column).limit(0);
  if (!error) {
    return true;
  }
  if (isMissingTableError(error, table) || isMissingColumnError(error, column)) {
    return false;
  }
  return true;
}
