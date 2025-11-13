import { Message } from '../entities/Message';

export interface IMessageRepository {
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message | null>;
  getByContact(contactId: string): Promise<Message[]>;
  save(message: Message): Promise<void>;
  delete(id: string): Promise<void>;
}

