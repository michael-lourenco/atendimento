import { BotBehavior } from './botBehavior';
import { BusinessHours } from './businessHours';

export type WhatsAppNumberStatus = 'active' | 'inactive';

export interface WhatsAppNumber {
  id: string;
  name: string;
  number: string;
  status: WhatsAppNumberStatus;
  provider: string;
  instanceName?: string;
  behavior?: Partial<BotBehavior>;
  flowId?: string;
  businessHours?: BusinessHours;
  createdAt: Date;
}
