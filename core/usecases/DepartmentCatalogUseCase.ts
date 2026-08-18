import { Department } from '../entities/Department';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class DepartmentCatalogUseCase extends CatalogUseCase<Department> {
  constructor(repo: IDepartmentRepository = serviceLocator.getDepartmentRepository()) {
    super(repo);
  }
}
