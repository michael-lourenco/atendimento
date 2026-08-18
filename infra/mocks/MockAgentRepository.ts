import { Agent } from '../../core/entities/Agent';
import { IAgentRepository } from '../../core/repositories/IAgentRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Agent[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana@example.com',
    status: 'online',
    departmentId: '1',
    conversationsCount: 12,
    responseTime: '2 min',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Carlos Santos',
    email: 'carlos@example.com',
    status: 'offline',
    departmentId: '2',
    conversationsCount: 8,
    responseTime: '5 min',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockAgentRepository: IAgentRepository = createInMemoryCrud(seed);
