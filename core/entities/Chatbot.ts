import { BusinessHours } from './businessHours';

export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  flowId?: string;
  messagesCount: number;
  businessHours?: BusinessHours;
  createdAt: Date;
  updatedAt: Date;
}
