import { isDirectContactJid } from './isDirectContactJid';
import { normalizeEvolutionEvent } from './mapEvolutionStatus';

export type EvolutionPresence = {
  phone: string;
  composing: boolean;
};

function asItems(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((item) => item && typeof item === 'object') as Record<string, unknown>[];
  }
  if (data && typeof data === 'object') {
    return [data as Record<string, unknown>];
  }
  return [];
}

function phoneFromJid(jid: string): string {
  return jid.split('@')[0] || '';
}

function composingOf(value: unknown): boolean | null {
  const text = String(value || '').toLowerCase();
  if (text === 'composing' || text === 'recording') {
    return true;
  }
  if (text === 'paused' || text === 'available' || text === 'unavailable') {
    return false;
  }
  return null;
}

export function isEvolutionPresenceEvent(event: unknown): boolean {
  return normalizeEvolutionEvent(event) === 'presence.update';
}

export function mapEvolutionPresence(payload: {
  event?: string;
  data?: unknown;
}): EvolutionPresence[] {
  if (!isEvolutionPresenceEvent(payload.event)) {
    return [];
  }
  const mapped: EvolutionPresence[] = [];
  for (const item of asItems(payload.data)) {
    const presences = item.presences;
    if (presences && typeof presences === 'object') {
      for (const [jid, info] of Object.entries(presences as Record<string, unknown>)) {
        if (!isDirectContactJid(jid)) {
          continue;
        }
        const bag = info && typeof info === 'object' ? (info as Record<string, unknown>) : {};
        const flag = composingOf(bag.lastKnownPresence ?? bag.presence ?? info);
        if (flag == null) {
          continue;
        }
        mapped.push({ phone: phoneFromJid(jid), composing: flag });
      }
      continue;
    }
    const jid =
      (typeof item.id === 'string' && item.id) ||
      (typeof item.remoteJid === 'string' && item.remoteJid) ||
      '';
    if (!jid || !isDirectContactJid(jid)) {
      continue;
    }
    const flag = composingOf(item.presence ?? item.lastKnownPresence);
    if (flag == null) {
      continue;
    }
    mapped.push({ phone: phoneFromJid(jid), composing: flag });
  }
  return mapped;
}
