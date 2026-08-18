import { SupabaseClient } from '@supabase/supabase-js';
import { ICrudRepository } from '../../core/repositories/ICrudRepository';

export function asDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(String(value ?? 0));
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item));
}

export function createSupabaseCrud<T extends { id: string }>(
  client: SupabaseClient,
  table: string,
  fromRow: (row: Record<string, unknown>) => T,
  toRow: (entity: T) => Record<string, unknown>
): ICrudRepository<T> {
  return {
    async getAll() {
      const { data, error } = await client.from(table).select('*');
      if (error) {
        throw error;
      }
      return (data ?? []).map((row) => fromRow(row as Record<string, unknown>));
    },
    async getById(id: string) {
      const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle();
      if (error) {
        throw error;
      }
      return data ? fromRow(data as Record<string, unknown>) : null;
    },
    async save(entity: T) {
      const { error } = await client.from(table).upsert(toRow(entity));
      if (error) {
        throw error;
      }
    },
    async delete(id: string) {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) {
        throw error;
      }
    },
  };
}
