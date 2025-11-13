export interface InternalMessage {
  id: string;
  from: string;
  fromName: string;
  to?: string;
  toName?: string;
  conversationId: string;
  content: string;
  type: 'text' | 'transfer' | 'note' | 'system';
  timestamp: Date;
  departmentId?: string;
}

