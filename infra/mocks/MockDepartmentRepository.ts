import { Department } from '../../core/entities/Department';
import { IDepartmentRepository } from '../../core/repositories/IDepartmentRepository';
import {
  INTAKE_DEPARTMENT_CLIENTE,
  INTAKE_DEPARTMENT_COMERCIAL,
  INTAKE_DEPARTMENT_DEMO,
} from '../../core/entities/atendimentoInicialFlow';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Department[] = [
  {
    id: INTAKE_DEPARTMENT_COMERCIAL,
    name: 'Comercial',
    description: 'Leads prontos para conversa e fechamento',
    color: '#16a34a',
    isActive: true,
    agentsCount: 1,
    conversationsCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: INTAKE_DEPARTMENT_DEMO,
    name: 'Demonstração',
    description: 'Quem quer ver o painel no computador',
    color: '#2563eb',
    isActive: true,
    agentsCount: 1,
    conversationsCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: INTAKE_DEPARTMENT_CLIENTE,
    name: 'Cliente',
    description: 'Quem já usa o sistema e precisa de suporte',
    color: '#d97706',
    isActive: true,
    agentsCount: 1,
    conversationsCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockDepartmentRepository: IDepartmentRepository = createInMemoryCrud(seed);
