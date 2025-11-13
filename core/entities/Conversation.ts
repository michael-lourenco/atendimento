import { Message } from './Message';

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  departmentId?: string;
  departmentName?: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  status: 'open' | 'closed' | 'waiting' | 'transferred';
  unreadCount: number;
  lastMessage?: Message;
  lastActivity: Date;
  createdAt: Date;
  tags: string[];
}

