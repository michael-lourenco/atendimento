import { Report } from '../entities/Report';
import { IReportRepository } from '../repositories/IReportRepository';

export class GenerateReportUseCase {
  constructor(private reports: IReportRepository) {}

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
