import { IMessageRepository } from '../../core/repositories/IMessageRepository';
import { Message } from '../../core/entities/Message';

export class MockMessageRepository implements IMessageRepository {
  private messages: Message[] = [
    {
      id: 'msg1',
      from: '5511999999999',
      to: '5511888888888',
      content: 'Olá, preciso de ajuda',
      type: 'text',
      timestamp: new Date('2024-01-15T10:00:00'),
      flowId: 'inicio',
      stepId: 'step1',
      direction: 'incoming',
      status: 'read',
    },
    {
      id: 'msg2',
      from: '5511888888888',
      to: '5511999999999',
      content: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
      type: 'text',
      timestamp: new Date('2024-01-15T10:01:00'),
      flowId: 'inicio',
      stepId: 'step1',
      direction: 'outgoing',
      status: 'delivered',
    },
    {
      id: 'msg3',
      from: '5511999999999',
      to: '5511888888888',
      content: 'Preciso de suporte técnico',
      type: 'text',
      timestamp: new Date('2024-01-15T10:02:00'),
      flowId: 'inicio',
      stepId: 'step2',
      direction: 'incoming',
      status: 'read',
    },
    {
      id: 'msg4',
      from: '5511777777777',
      to: '5511888888888',
      content: 'Quero fazer um pedido',
      type: 'text',
      timestamp: new Date('2024-01-15T11:00:00'),
      flowId: 'inicio',
      stepId: 'step1',
      direction: 'incoming',
      status: 'read',
    },
  ];

  async getAll(): Promise<Message[]> {
    return Promise.resolve(this.messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }

  async getById(id: string): Promise<Message | null> {
    const message = this.messages.find(m => m.id === id);
    return Promise.resolve(message || null);
  }

  async getByContact(contactId: string): Promise<Message[]> {
    const contactMessages = this.messages.filter(
      m => m.from === contactId || m.to === contactId
    );
    return Promise.resolve(contactMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()));
  }

  async save(message: Message): Promise<void> {
    const existingIndex = this.messages.findIndex(m => m.id === message.id);
    if (existingIndex >= 0) {
      this.messages[existingIndex] = message;
    } else {
      this.messages.push(message);
    }
    return Promise.resolve();
  }

  async delete(id: string): Promise<void> {
    this.messages = this.messages.filter(m => m.id !== id);
    return Promise.resolve();
  }
}

export const mockMessageRepository = new MockMessageRepository();

