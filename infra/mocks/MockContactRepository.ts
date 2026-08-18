import { Contact } from '../../core/entities/Contact';
import { IContactRepository } from '../../core/repositories/IContactRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Contact[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '5511999999999',
    email: 'joao@example.com',
    tags: ['Cliente', 'VIP'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '5511888888888',
    email: 'maria@example.com',
    tags: ['Cliente'],
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
];

export const mockContactRepository: IContactRepository = createInMemoryCrud(seed);
