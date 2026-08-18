import { Report } from '../../core/entities/Report';
import { IReportRepository } from '../../core/repositories/IReportRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Report[] = [
  {
    id: '1',
    title: 'Relatório Mensal - Janeiro 2024',
    type: 'monthly',
    period: '01/01/2024 - 31/01/2024',
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '2',
    title: 'Relatório de Conversas',
    type: 'conversations',
    period: 'Últimos 30 dias',
    createdAt: new Date('2024-01-15'),
  },
];

export const mockReportRepository: IReportRepository = createInMemoryCrud(seed);
