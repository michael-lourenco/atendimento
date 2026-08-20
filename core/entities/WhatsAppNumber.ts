import { BotBehavior } from './botBehavior';

export type WhatsAppNumberStatus = 'active' | 'inactive';

export interface WhatsAppNumber {
  id: string;
  name: string;
  number: string;
  status: WhatsAppNumberStatus;
  provider: string;
  instanceName?: string;
  behavior?: Partial<BotBehavior>;
  createdAt: Date;
}
