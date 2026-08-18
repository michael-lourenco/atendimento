export type WhatsAppNumberStatus = 'active' | 'inactive';

export interface WhatsAppNumber {
  id: string;
  name: string;
  number: string;
  status: WhatsAppNumberStatus;
  provider: string;
  createdAt: Date;
}
