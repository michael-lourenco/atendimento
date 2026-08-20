import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IMediaStorage, StoredMedia } from '../services/IMediaStorage';
import { GetFlowStepMediaUseCase } from './GetFlowStepMediaUseCase';

const now = new Date('2026-08-20T12:00:00Z');

const flow: Flow = {
  id: 'inicio',
  name: 'Entrada',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [{ id: 'welcome', type: 'message', content: 'Olá' }],
};

class MemoryFlows implements IFlowRepository {
  constructor(public items: Flow[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save() {}
  async update() {}
  async delete() {}
}

class MemoryStorage implements IMediaStorage {
  constructor(private files = new Map<string, StoredMedia>()) {}
  async save(path: string, media: StoredMedia) {
    this.files.set(path, media);
  }
  async get(path: string) {
    return this.files.get(path) ?? null;
  }
  async remove(path: string) {
    this.files.delete(path);
  }
}

describe('GetFlowStepMediaUseCase', () => {
  it('lê o path do passo', async () => {
    const storage = new MemoryStorage(
      new Map([
        ['flows/inicio/welcome', { bytes: new Uint8Array([3]), mimeType: 'image/jpeg' }],
      ])
    );
    const file = await new GetFlowStepMediaUseCase(new MemoryFlows([flow]), storage).execute(
      'inicio',
      'welcome'
    );
    expect(file?.bytes[0]).toBe(3);
  });

  it('ausente retorna null', async () => {
    const file = await new GetFlowStepMediaUseCase(
      new MemoryFlows([flow]),
      new MemoryStorage()
    ).execute('inicio', 'welcome');
    expect(file).toBeNull();
  });
});
