import { Tag } from '../../core/entities/Tag';
import { ITagRepository } from '../../core/repositories/ITagRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Tag[] = [
  {
    id: '1',
    name: 'Cliente',
    color: '#3b82f6',
    contactsCount: 45,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'VIP',
    color: '#f59e0b',
    contactsCount: 12,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Prospecto',
    color: '#10b981',
    contactsCount: 23,
    createdAt: new Date('2024-01-03'),
  },
];

export const mockTagRepository: ITagRepository = createInMemoryCrud(seed);
