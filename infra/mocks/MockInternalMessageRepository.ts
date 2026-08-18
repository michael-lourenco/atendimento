import { InternalMessage } from '../../core/entities/InternalMessage';
import { IInternalMessageRepository } from '../../core/repositories/IInternalMessageRepository';

export class MockInternalMessageRepository implements IInternalMessageRepository {
  private messages: InternalMessage[] = [
    {
      id: '1',
      from: '1',
      fromName: 'Ana Silva',
      conversationId: '1',
      content: 'Cliente interessado em produto premium',
      type: 'note',
      timestamp: new Date('2024-01-15T10:15:00'),
      departmentId: '1',
    },
    {
      id: '2',
      from: '1',
      fromName: 'Ana Silva',
      to: '2',
      toName: 'Carlos Santos',
      conversationId: '1',
      content: 'Transferindo para suporte técnico',
      type: 'transfer',
      timestamp: new Date('2024-01-15T10:20:00'),
      departmentId: '2',
    },
  ];

  async getByConversation(conversationId: string): Promise<InternalMessage[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async save(message: InternalMessage): Promise<void> {
    this.messages.push({
      ...message,
      id: message.id || `msg-${Date.now()}`,
    });
  }
}

export const mockInternalMessageRepository = new MockInternalMessageRepository();
