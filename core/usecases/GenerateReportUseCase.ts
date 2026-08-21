import { Report } from '../entities/Report';
import { IReportRepository } from '../repositories/IReportRepository';
import { reportHistoryPeriod } from '../entities/reportCsv';

export class GenerateReportUseCase {
  constructor(private reports: IReportRepository) {}

  async execute(now: Date = new Date()): Promise<Report> {
    const report: Report = {
      id: `report-${now.getTime()}`,
      title: `Relatório de Conversas — ${now.toLocaleDateString('pt-BR')}`,
      type: 'conversations',
      period: reportHistoryPeriod(now),
      createdAt: now,
    };

    await this.reports.save(report);
    return report;
  }
}
