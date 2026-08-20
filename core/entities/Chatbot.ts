import { BotBehavior } from './botBehavior';
import { BusinessHours } from './businessHours';

export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  flowId?: string;
  messagesCount: number;
  businessHours?: BusinessHours;
  behavior?: Partial<BotBehavior>;
  createdAt: Date;
  updatedAt: Date;
}
