import { ICrudRepository } from '../../core/repositories/ICrudRepository';

export function createInMemoryCrud<T extends { id: string }>(seed: T[]): ICrudRepository<T> {
  let items = seed.map((item) => ({ ...item }));

  return {
    async getAll() {
      return [...items];
    },
    async getById(id: string) {
      return items.find((item) => item.id === id) ?? null;
    },
    async save(entity: T) {
      const index = items.findIndex((item) => item.id === entity.id);
      if (index >= 0) {
        items[index] = entity;
      } else {
        items.push(entity);
      }
    },
    async delete(id: string) {
      items = items.filter((item) => item.id !== id);
    },
  };
}
