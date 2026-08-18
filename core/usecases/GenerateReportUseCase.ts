import { Report } from '../entities/Report';
import { IReportRepository } from '../repositories/IReportRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class GenerateReportUseCase {
  constructor(private reports: IReportRepository = serviceLocator.getReportRepository()) {}

  async execute(now: Date = new Date()): Promise<Report> {
    const report: Report = {
      id: `report-${now.getTime()}`,
      title: `Relatório de Conversas — ${now.toLocaleDateString('pt-BR')}`,
      type: 'conversations',
      period: 'Atual',
      createdAt: now,
    };

    await this.reports.save(report);
    return report;
  }
}
