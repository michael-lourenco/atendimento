import { SendReactionParams } from '../../core/services/IWhatsAppService';

export async function sendMetaReaction(
  baseUrl: string,
  accessToken: string,
  params: SendReactionParams
): Promise<void> {
  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to.replace(/\D/g, ''),
      type: 'reaction',
      reaction: {
        message_id: params.messageId,
        emoji: params.emoji,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Erro ao enviar reação WhatsApp: ${response.status}`);
  }
}
