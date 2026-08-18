import axios from 'axios';
import { QRCodeResponse, StatusResponse } from './ChatWhatsAppService';
import { isOpenState, mapEvolutionConnectToQr, mapEvolutionState } from './evolutionConnectionMap';

function instanceName(): string {
  return process.env.EVOLUTION_INSTANCE_NAME || 'default';
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

async function readState(client: ReturnType<typeof createClient>): Promise<string> {
  const response = await client.get(`/instance/connectionState/${instanceName()}`);
  const state = response.data?.instance?.state ?? response.data?.state;
  return String(state || 'close');
}

export async function getEvolutionQrCode(): Promise<QRCodeResponse> {
  const client = createClient();
  const state = await readState(client);
  const connected = isOpenState(state);
  if (connected) {
    return { qr: null, available: false, connected: true };
  }
  const response = await client.get(`/instance/connect/${instanceName()}`);
  return mapEvolutionConnectToQr(
    (response.data ?? {}) as Record<string, unknown>,
    false
  );
}

export async function getEvolutionStatus(): Promise<StatusResponse> {
  const client = createClient();
  const state = await readState(client);
  const list = await client.get('/instance/fetchInstances');
  const rows = Array.isArray(list.data) ? list.data : [];
  const mine = rows.find((row: { name?: string }) => row.name === instanceName());
  return mapEvolutionState(state, {
    ownerJid: mine?.ownerJid ?? null,
    profileName: mine?.profileName ?? null,
  });
}
