import { AxiosInstance } from 'axios';
import { SendPresenceParams } from '../../core/services/IWhatsAppService';

export async function sendEvolutionPresence(
  client: AxiosInstance,
  instanceName: string,
  params: SendPresenceParams
): Promise<void> {
  const toNumber = params.to.replace(/\D/g, '');
  await client.post(`/chat/sendPresence/${instanceName}`, {
    number: toNumber,
    delay: params.delayMs ?? 2000,
    presence: params.presence,
  });
}
