import { Tag } from '../../core/entities/Tag';
import { ITagRepository } from '../../core/repositories/ITagRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Tag[] = [
  {
    id: 'lead',
    name: 'lead',
    color: '#2563eb',
    contactsCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'demo',
    name: 'demo',
    color: '#7c3aed',
    contactsCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'proposta',
    name: 'proposta',
    color: '#d97706',
    contactsCount: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'cliente',
    name: 'cliente',
    color: '#16a34a',
    contactsCount: 0,
    createdAt: new Date('2024-01-01'),
  },
];

export const mockTagRepository: ITagRepository = createInMemoryCrud(seed);
