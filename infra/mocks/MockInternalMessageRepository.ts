import { InternalMessage } from '../../core/entities/InternalMessage';

export interface IInternalMessageRepository {
  getByConversation(conversationId: string): Promise<InternalMessage[]>;
  save(message: InternalMessage): Promise<void>;
}

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
    const conversationMessages = this.messages.filter(
      m => m.conversationId === conversationId
    );
    return Promise.resolve(
      conversationMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    );
  }

  async save(message: InternalMessage): Promise<void> {
    this.messages.push({
      ...message,
      id: `msg-${Date.now()}`,
    });
    return Promise.resolve();
  }
}

export const mockInternalMessageRepository = new MockInternalMessageRepository();

