import { AxiosInstance } from 'axios';
import { SendReactionParams } from '../../core/services/IWhatsAppService';

export async function sendEvolutionReaction(
  client: AxiosInstance,
  instanceName: string,
  params: SendReactionParams
): Promise<void> {
  const toNumber = params.to.replace(/\D/g, '');
  await client.post(`/message/sendReaction/${instanceName}`, {
    key: {
      remoteJid: `${toNumber}@s.whatsapp.net`,
      fromMe: params.fromMe,
      id: params.messageId,
    },
    reaction: params.emoji,
  });
}
