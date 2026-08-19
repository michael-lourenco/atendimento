import { MessageStatus } from '../../core/entities/Message';
import { evolutionAckToStatus } from '../../core/entities/messageStatus';

export function normalizeEvolutionEvent(event: unknown): string {
  return String(event || '')
    .toLowerCase()
    .replace(/_/g, '.');
}

function asItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.messages)) {
      return record.messages.filter((item) => item && typeof item === 'object') as Record<
        string,
        unknown
      >[];
    }
    if (record.data && typeof record.data === 'object' && !record.key && !record.keyId) {
      return asItems(record.data);
    }
    return [record];
  }
  return [];
}

function idOf(item: Record<string, unknown>): string {
  const key = item.key && typeof item.key === 'object' ? (item.key as Record<string, unknown>) : {};
  const raw = item.keyId ?? item.key_id ?? key.id ?? item.id;
  return typeof raw === 'string' && raw ? raw : '';
}

function ackOf(item: Record<string, unknown>): unknown {
  const update = item.update && typeof item.update === 'object' ? (item.update as Record<string, unknown>) : {};
  const key = item.key && typeof item.key === 'object' ? (item.key as Record<string, unknown>) : {};
  return item.status ?? update.status ?? item.ack ?? key.status ?? update.ack;
}

export function mapEvolutionStatusUpdates(payload: {
  event?: string;
  data?: unknown;
}): Array<{ id: string; status: MessageStatus }> {
  if (normalizeEvolutionEvent(payload.event) !== 'messages.update') {
    return [];
  }
  const mapped: Array<{ id: string; status: MessageStatus }> = [];
  for (const item of asItems(payload.data)) {
    const id = idOf(item);
    const status = evolutionAckToStatus(ackOf(item));
    if (!id || !status) continue;
    mapped.push({ id, status });
  }
  return mapped;
}
