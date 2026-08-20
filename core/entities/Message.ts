export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageReaction = {
  emoji: string;
  from: string;
};

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video';
  timestamp: Date;
  flowId?: string;
  stepId?: string;
  contactName?: string;
  direction: 'incoming' | 'outgoing';
  status: MessageStatus;
  reactions?: MessageReaction[];
  quotedMessageId?: string;
  quotedContent?: string;
  quotedFrom?: string;
}

