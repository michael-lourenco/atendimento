import { ChatWhatsAppService, MessagesResponse, QRCodeResponse, StatusResponse } from './ChatWhatsAppService';
import { getEvolutionQrCode, getEvolutionStatus } from './evolutionConnection';
import { isEvolutionProvider } from './isEvolutionProvider';
import { serverLocator } from '../adapters/serverLocator';

const STATUS_CACHE_MS = 3000;
let statusCache: { at: number; key: string; value: StatusResponse } | null = null;

export async function getDashboardQrCode(instance?: string | null): Promise<QRCodeResponse> {
  if (isEvolutionProvider()) {
    return getEvolutionQrCode(instance);
  }
  return new ChatWhatsAppService().getQRCode();
}

export async function getDashboardWhatsAppStatus(instance?: string | null): Promise<StatusResponse> {
  const key = instance?.trim() || '';
  if (statusCache && statusCache.key === key && Date.now() - statusCache.at < STATUS_CACHE_MS) {
    return statusCache.value;
  }
  const value = isEvolutionProvider()
    ? await getEvolutionStatus(instance)
    : await new ChatWhatsAppService().getStatus();
  statusCache = { at: Date.now(), key, value };
  return value;
}

export async function getDashboardWhatsAppMessages(
  limit: number,
  offset: number
): Promise<MessagesResponse> {
  if (isEvolutionProvider()) {
    const all = await serverLocator.getRepos().message.getAll();
    const sorted = [...all].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const slice = sorted.slice(offset, offset + limit);
    return {
      messages: slice.map((message) => ({
        id: message.id,
        from: message.from,
        to: message.to,
        content: message.content,
        type: message.type,
        direction: message.direction,
        timestamp:
          message.timestamp instanceof Date
            ? message.timestamp.toISOString()
            : String(message.timestamp),
        status: message.status,
      })),
      total: sorted.length,
      limit,
      offset,
    };
  }
  return new ChatWhatsAppService().getMessages(limit, offset);
}
