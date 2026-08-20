import { AxiosInstance } from 'axios';
import { MarkMessagesReadParams } from '../../core/services/IWhatsAppService';

export function evolutionReadMessagesBody(to: string, messageIds: string[]) {
  const remoteJid = `${to.replace(/\D/g, '')}@s.whatsapp.net`;
  return {
    readMessages: messageIds.map((id) => ({
      remoteJid,
      fromMe: false as const,
      id,
    })),
  };
}

export async function sendEvolutionMarkMessagesRead(
  client: AxiosInstance,
  instanceName: string,
  params: MarkMessagesReadParams
): Promise<void> {
  if (params.messageIds.length === 0) {
    return;
  }
  await client.post(
    `/chat/markMessageAsRead/${instanceName}`,
    evolutionReadMessagesBody(params.to, params.messageIds)
  );
}
