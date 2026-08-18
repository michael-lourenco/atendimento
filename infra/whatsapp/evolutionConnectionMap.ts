import { QRCodeResponse, StatusResponse } from './ChatWhatsAppService';

export function mapEvolutionConnectToQr(
  body: Record<string, unknown>,
  connected: boolean
): QRCodeResponse {
  const nested = body.qrcode as Record<string, unknown> | undefined;
  const raw =
    (typeof body.base64 === 'string' && body.base64) ||
    (typeof nested?.base64 === 'string' && nested.base64) ||
    null;
  const qr = connected ? null : raw;
  return {
    qr,
    available: !connected && Boolean(qr),
    connected,
  };
}

export function mapEvolutionState(
  state: string,
  profile?: { ownerJid?: string | null; profileName?: string | null }
): StatusResponse {
  const connected = state === 'open';
  return {
    connected,
    qrAvailable: state === 'connecting',
    info: connected
      ? {
          wid: profile?.ownerJid ?? null,
          pushname: profile?.profileName ?? null,
          platform: 'evolution',
        }
      : null,
  };
}

export function isOpenState(state: string): boolean {
  return state === 'open';
}
