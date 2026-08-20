import { MarkMessagesReadParams } from '../../core/services/IWhatsAppService';

export function metaReadMessagePayload(messageId: string) {
  return {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };
}

export async function sendMetaMarkMessagesRead(
  baseUrl: string,
  accessToken: string,
  params: MarkMessagesReadParams
): Promise<void> {
  for (const messageId of params.messageIds) {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metaReadMessagePayload(messageId)),
    });
    if (!response.ok) {
      throw new Error(`Erro ao marcar mensagem como lida: ${response.status}`);
    }
  }
}
