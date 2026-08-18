export interface Chatbot {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  flowId?: string;
  messagesCount: number;
  createdAt: Date;
  updatedAt: Date;
}
