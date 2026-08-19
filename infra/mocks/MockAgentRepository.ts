import { Agent } from '../../core/entities/Agent';
import { IAgentRepository } from '../../core/repositories/IAgentRepository';
import {
  INTAKE_DEPARTMENT_COMERCIAL,
  INTAKE_DEPARTMENT_DEMO,
} from '../../core/entities/atendimentoInicialFlow';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Agent[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@example.com',
    status: 'online',
    departmentId: INTAKE_DEPARTMENT_COMERCIAL,
    conversationsCount: 0,
    responseTime: '—',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Usuário',
    email: 'user@example.com',
    status: 'online',
    departmentId: INTAKE_DEPARTMENT_DEMO,
    conversationsCount: 0,
    responseTime: '—',
    createdAt: new Date('2024-01-01'),
  },
];

export const mockAgentRepository: IAgentRepository = createInMemoryCrud(seed);
