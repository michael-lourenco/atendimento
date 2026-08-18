import { Department } from '../../core/entities/Department';
import { IDepartmentRepository } from '../../core/repositories/IDepartmentRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Department[] = [
  {
    id: '1',
    name: 'Vendas',
    description: 'Setor de vendas e prospecção',
    color: '#3b82f6',
    isActive: true,
    agentsCount: 3,
    conversationsCount: 15,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Suporte',
    description: 'Atendimento técnico e suporte',
    color: '#10b981',
    isActive: true,
    agentsCount: 5,
    conversationsCount: 28,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'Financeiro',
    description: 'Cobrança e questões financeiras',
    color: '#f59e0b',
    isActive: true,
    agentsCount: 2,
    conversationsCount: 8,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

export const mockDepartmentRepository: IDepartmentRepository = createInMemoryCrud(seed);
