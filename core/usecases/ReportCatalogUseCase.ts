import { Report } from '../entities/Report';
import { IReportRepository } from '../repositories/IReportRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class ReportCatalogUseCase extends CatalogUseCase<Report> {
  constructor(repo: IReportRepository = serviceLocator.getReportRepository()) {
    super(repo);
  }
}
