import { ChatWhatsAppService, MessagesResponse, QRCodeResponse, StatusResponse } from './ChatWhatsAppService';
import { getEvolutionQrCode, getEvolutionStatus } from './evolutionConnection';
import { isEvolutionProvider } from './isEvolutionProvider';
import { serverLocator } from '../adapters/serverLocator';

export async function getDashboardQrCode(): Promise<QRCodeResponse> {
  if (isEvolutionProvider()) {
    return getEvolutionQrCode();
  }
  return new ChatWhatsAppService().getQRCode();
}

export async function getDashboardWhatsAppStatus(): Promise<StatusResponse> {
  if (isEvolutionProvider()) {
    return getEvolutionStatus();
  }
  return new ChatWhatsAppService().getStatus();
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
