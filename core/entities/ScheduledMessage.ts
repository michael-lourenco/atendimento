export type ScheduleStatus = 'pending' | 'sent' | 'failed';

export interface ScheduledMessage {
  id: string;
  contact: string;
  message: string;
  scheduledDate: Date;
  status: ScheduleStatus;
  createdAt: Date;
  conversationId?: string;
}
