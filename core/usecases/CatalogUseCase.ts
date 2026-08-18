import { ICrudRepository } from '../repositories/ICrudRepository';

export class CatalogUseCase<T extends { id: string }> {
  constructor(private readonly repo: ICrudRepository<T>) {}

  list(): Promise<T[]> {
    return this.repo.getAll();
  }

  getById(id: string): Promise<T | null> {
    return this.repo.getById(id);
  }

  save(entity: T): Promise<void> {
    return this.repo.save(entity);
  }

  delete(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
