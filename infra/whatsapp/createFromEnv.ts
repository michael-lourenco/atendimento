import { IWhatsAppService } from '../../core/services/IWhatsAppService';
import { WhatsAppService } from './WhatsAppService';
import { TwilioWhatsAppService } from './TwilioWhatsAppService';
import { EvolutionWhatsAppService } from './EvolutionWhatsAppService';

export function createWhatsAppServiceFromEnv(): IWhatsAppService {
  const provider = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();
  switch (provider) {
    case 'twilio':
      return new TwilioWhatsAppService();
    case 'evolution':
      return new EvolutionWhatsAppService();
    case 'meta':
    default:
      return new WhatsAppService();
  }
}
