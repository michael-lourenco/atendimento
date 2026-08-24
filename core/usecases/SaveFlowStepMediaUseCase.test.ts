import { Flow } from '../entities/Flow';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { IMediaStorage, MAX_OUTGOING_MEDIA_BYTES, StoredMedia } from '../services/IMediaStorage';
import {
  InvalidFlowStepMediaError,
  SaveFlowStepMediaUseCase,
} from './SaveFlowStepMediaUseCase';

const now = new Date('2026-08-20T12:00:00Z');

const sampleFlow = (): Flow => ({
  id: 'inicio',
  name: 'Entrada',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [
    { id: 'welcome', type: 'message', content: 'Olá' },
    { id: 'ask', type: 'question', content: 'Qual área?' },
  ],
});

class MemoryFlows implements IFlowRepository {
  constructor(public items: Flow[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(flow: Flow) {
    this.items = [...this.items.filter((item) => item.id !== flow.id), flow];
  }
  async update(flow: Flow) {
    await this.save(flow);
  }
  async delete() {}
}

class MemoryStorage implements IMediaStorage {
  files = new Map<string, StoredMedia>();
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

describe('SaveFlowStepMediaUseCase', () => {
  it('grava imagem e path no passo message', async () => {
    const flows = new MemoryFlows([sampleFlow()]);
    const storage = new MemoryStorage();
    const updated = await new SaveFlowStepMediaUseCase(flows, storage).execute(
      'inicio',
      'welcome',
      { bytes: new Uint8Array([1, 2]), mimeType: 'image/png' }
    );
    expect(updated?.steps[0].mediaUrl).toBe('flows/inicio/welcome');
    expect(updated?.steps[0].mediaKind).toBe('image');
    expect(storage.files.get('flows/inicio/welcome')?.mimeType).toBe('image/png');
  });

  it('grava áudio', async () => {
    const flows = new MemoryFlows([sampleFlow()]);
    const updated = await new SaveFlowStepMediaUseCase(flows, new MemoryStorage()).execute(
      'inicio',
      'welcome',
      { bytes: new Uint8Array([1]), mimeType: 'audio/ogg' }
    );
    expect(updated?.steps[0].mediaKind).toBe('audio');
  });

  it('grava vídeo e PDF', async () => {
    const flows = new MemoryFlows([sampleFlow()]);
    const video = await new SaveFlowStepMediaUseCase(flows, new MemoryStorage()).execute(
      'inicio',
      'welcome',
      { bytes: new Uint8Array([1]), mimeType: 'video/mp4' }
    );
    expect(video?.steps[0].mediaKind).toBe('video');
    const pdf = await new SaveFlowStepMediaUseCase(flows, new MemoryStorage()).execute(
      'inicio',
      'welcome',
      { bytes: new Uint8Array([1]), mimeType: 'application/pdf' }
    );
    expect(pdf?.steps[0].mediaKind).toBe('document');
  });

  it('recusa documento que não é PDF', async () => {
    const flows = new MemoryFlows([sampleFlow()]);
    await expect(
      new SaveFlowStepMediaUseCase(flows, new MemoryStorage()).execute('inicio', 'welcome', {
        bytes: new Uint8Array([1]),
        mimeType: 'application/zip',
      })
    ).rejects.toBeInstanceOf(InvalidFlowStepMediaError);
  });

  it('recusa arquivo maior que 16 MB', async () => {
    const flows = new MemoryFlows([sampleFlow()]);
    await expect(
      new SaveFlowStepMediaUseCase(flows, new MemoryStorage()).execute('inicio', 'welcome', {
        bytes: new Uint8Array(MAX_OUTGOING_MEDIA_BYTES + 1),
        mimeType: 'image/jpeg',
      })
    ).rejects.toBeInstanceOf(InvalidFlowStepMediaError);
  });

  it('fluxo, passo inexistente ou que não é message retorna null', async () => {
    const flows = new MemoryFlows([sampleFlow()]);
    const useCase = new SaveFlowStepMediaUseCase(flows, new MemoryStorage());
    const media = { bytes: new Uint8Array([1]), mimeType: 'image/png' };
    expect(await useCase.execute('missing', 'welcome', media)).toBeNull();
    expect(await useCase.execute('inicio', 'missing', media)).toBeNull();
    expect(await useCase.execute('inicio', 'ask', media)).toBeNull();
  });

  it('null limpa campos e remove do storage', async () => {
    const flows = new MemoryFlows([
      {
        ...sampleFlow(),
        steps: [
          {
            id: 'welcome',
            type: 'message',
            content: 'Olá',
            mediaUrl: 'flows/inicio/welcome',
            mediaKind: 'image',
          },
        ],
      },
    ]);
    const storage = new MemoryStorage();
    await storage.save('flows/inicio/welcome', {
      bytes: new Uint8Array([9]),
      mimeType: 'image/png',
    });
    const updated = await new SaveFlowStepMediaUseCase(flows, storage).execute(
      'inicio',
      'welcome',
      null
    );
    expect(updated?.steps[0].mediaUrl).toBeUndefined();
    expect(updated?.steps[0].mediaKind).toBeUndefined();
    expect(storage.files.has('flows/inicio/welcome')).toBe(false);
  });
});
