import axios from 'axios';
import { QRCodeResponse, StatusResponse } from './ChatWhatsAppService';
import { isOpenState, mapEvolutionConnectToQr, mapEvolutionState } from './evolutionConnectionMap';
import { defaultEvolutionInstanceName } from '../../core/entities/whatsappNumberLine';

export function evolutionInstanceName(requested?: string | null): string {
  const name = requested?.trim();
  return name || defaultEvolutionInstanceName();
}

function createClient() {
  const baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  if (!apiKey) {
    throw new Error('EVOLUTION_API_KEY ausente');
  }
  return axios.create({
    baseURL: baseUrl,
    timeout: 15000,
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
  });
}

async function readState(
  client: ReturnType<typeof createClient>,
  instance: string
): Promise<string> {
  const response = await client.get(`/instance/connectionState/${instance}`);
  const state = response.data?.instance?.state ?? response.data?.state;
  return String(state || 'close');
}

export async function getEvolutionQrCode(instance?: string | null): Promise<QRCodeResponse> {
  const name = evolutionInstanceName(instance);
  const client = createClient();
  const state = await readState(client, name);
  const connected = isOpenState(state);
  if (connected) {
    return { qr: null, available: false, connected: true };
  }
  const response = await client.get(`/instance/connect/${name}`);
  return mapEvolutionConnectToQr((response.data ?? {}) as Record<string, unknown>, false);
}

export async function getEvolutionStatus(instance?: string | null): Promise<StatusResponse> {
  const client = createClient();
  const list = await client.get('/instance/fetchInstances');
  const rows = Array.isArray(list.data) ? list.data : [];
  const instances = await Promise.all(
    rows.map(async (row: { name?: string; ownerJid?: string; profileName?: string }) => {
      const name = String(row.name || '');
      if (!name) {
        return null;
      }
      let connected = false;
      try {
        connected = isOpenState(await readState(client, name));
      } catch {
        connected = false;
      }
      return {
        name,
        connected,
        info: {
          wid: row.ownerJid ?? null,
          pushname: row.profileName ?? null,
          platform: 'evolution',
        },
      };
    })
  );
  const listed = instances.filter((item): item is NonNullable<typeof item> => item !== null);
  const requested = instance?.trim();
  const mine = requested
    ? listed.find((item) => item.name === requested)
    : listed.find((item) => item.connected) ?? listed.find((item) => item.name === evolutionInstanceName());
  const connected = requested ? Boolean(mine?.connected) : listed.some((item) => item.connected);
  const state = mine?.connected ? 'open' : 'close';
  const base = mapEvolutionState(state, {
    ownerJid: mine?.info.wid ?? null,
    profileName: mine?.info.pushname ?? null,
  });
  return { ...base, connected, instances: listed };
}

export async function ensureEvolutionInstance(instance: string): Promise<void> {
  const name = evolutionInstanceName(instance);
  const client = createClient();
  try {
    await client.post('/instance/create', {
      instanceName: name,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });
  } catch (error: unknown) {
    const status = axios.isAxiosError(error) ? error.response?.status : 0;
    if (status !== 403 && status !== 409 && status !== 400) {
      throw error;
    }
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (!appUrl) {
    return;
  }
  try {
    await client.post(`/webhook/set/${name}`, {
      webhook: {
        enabled: true,
        url: `${appUrl}/api/webhook/evolution`,
        webhookByEvents: false,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
      },
    });
  } catch {
    // instância existe; webhook pode já estar configurado
  }
}
