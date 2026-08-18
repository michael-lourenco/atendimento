import { CatalogUseCase } from './CatalogUseCase';
import { ICrudRepository } from '../repositories/ICrudRepository';

interface Item {
  id: string;
  name: string;
}

class FakeRepo implements ICrudRepository<Item> {
  constructor(private items: Item[] = []) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: Item) {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) {
      this.items[index] = entity;
    } else {
      this.items.push(entity);
    }
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

describe('CatalogUseCase', () => {
  it('lista, salva e exclui', async () => {
    const catalog = new CatalogUseCase(new FakeRepo([{ id: '1', name: 'A' }]));

    await catalog.save({ id: '2', name: 'B' });
    expect((await catalog.list()).map((item) => item.id)).toEqual(['1', '2']);

    await catalog.delete('1');
    expect(await catalog.list()).toEqual([{ id: '2', name: 'B' }]);
  });
});
