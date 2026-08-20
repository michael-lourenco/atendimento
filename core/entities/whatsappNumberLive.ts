import { WhatsAppNumber } from './WhatsAppNumber';

export const LIVE_WHATSAPP_NUMBER_ID = 'live-session';

export type LiveWhatsAppInfo = {
  connected: boolean;
  wid: string | null;
  pushname: string | null;
  platform?: string | null;
  instanceName?: string | null;
};

export function digitsFromWhatsAppWid(wid: string | null | undefined): string {
  if (!wid) return '';
  const local = wid.split('@')[0] ?? '';
  const withoutDevice = local.split(':')[0] ?? '';
  return withoutDevice.replace(/\D/g, '');
}

export function liveWhatsAppCatalogId(digits: string): string {
  return `live-${digits}`;
}

export function isLiveWhatsAppNumber(id: string): boolean {
  return id === LIVE_WHATSAPP_NUMBER_ID || id.startsWith('live-');
}

export function liveWhatsAppNumberForCatalog(
  catalog: WhatsAppNumber[],
  live: LiveWhatsAppInfo,
  now = new Date()
): WhatsAppNumber | null {
  if (!live.connected) return null;
  const digits = digitsFromWhatsAppWid(live.wid);
  if (!digits) return null;
  const requested = live.instanceName?.trim();
  const match =
    (requested
      ? catalog.find((row) => row.instanceName?.trim().toLowerCase() === requested.toLowerCase())
      : undefined) ?? catalog.find((row) => digitsFromWhatsAppWid(row.number) === digits);
  const instanceName = requested || match?.instanceName;
  return {
    id: match?.id ?? liveWhatsAppCatalogId(digits),
    name: live.pushname || match?.name || 'WhatsApp conectado',
    number: digits,
    status: 'active',
    provider: live.platform || match?.provider || 'evolution',
    createdAt: match?.createdAt ?? now,
    ...(instanceName ? { instanceName } : {}),
    ...(match?.behavior ? { behavior: match.behavior } : {}),
    ...(match?.flowId ? { flowId: match.flowId } : {}),
    ...(match?.businessHours ? { businessHours: match.businessHours } : {}),
  };
}

export function liveWhatsAppNumberNeedsSave(
  existing: WhatsAppNumber | undefined,
  next: WhatsAppNumber
): boolean {
  if (!existing) return true;
  return (
    existing.name !== next.name ||
    existing.number !== next.number ||
    existing.status !== next.status ||
    existing.provider !== next.provider ||
    (existing.instanceName ?? '') !== (next.instanceName ?? '')
  );
}

export function mergeWhatsAppNumbersWithLive(
  catalog: WhatsAppNumber[],
  live: LiveWhatsAppInfo
): WhatsAppNumber[] {
  if (!live.connected) return catalog;
  const next = liveWhatsAppNumberForCatalog(catalog, live);
  if (!next) {
    return [
      {
        id: LIVE_WHATSAPP_NUMBER_ID,
        name: live.pushname || 'WhatsApp conectado',
        number: 'Sessão ativa',
        status: 'active',
        provider: live.platform || 'evolution',
        createdAt: new Date(),
      },
      ...catalog,
    ];
  }
  if (catalog.some((row) => row.id === next.id)) {
    return catalog.map((row) => (row.id === next.id ? next : row));
  }
  return [next, ...catalog];
}
