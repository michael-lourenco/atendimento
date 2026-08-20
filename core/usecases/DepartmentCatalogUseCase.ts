import { Department } from '../entities/Department';
import { IDepartmentRepository } from '../repositories/IDepartmentRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class DepartmentCatalogUseCase extends CatalogUseCase<Department> {
  constructor(repo: IDepartmentRepository) {
    super(repo);
  }
}
