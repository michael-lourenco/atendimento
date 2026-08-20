import { IMediaStorage, StoredMedia } from '../services/IMediaStorage';
import { loadFlowStepMedia } from './loadFlowStepMedia';

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

describe('loadFlowStepMedia', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('http(s) continua com fetch público', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([7, 8]).buffer,
      headers: { get: () => 'image/png' },
    });
    const media = await loadFlowStepMedia('https://cdn.example/foto.png', 'image');
    expect(media?.mimeType).toBe('image/png');
    expect(media?.bytes[0]).toBe(7);
  });

  it('path e href da API leem o storage', async () => {
    const storage = new MemoryStorage(
      new Map([
        ['flows/inicio/welcome', { bytes: new Uint8Array([4]), mimeType: 'audio/ogg' }],
      ])
    );
    const fromPath = await loadFlowStepMedia('flows/inicio/welcome', 'audio', storage);
    const fromHref = await loadFlowStepMedia(
      '/api/flows/inicio/steps/welcome/media',
      'audio',
      storage
    );
    expect(fromPath?.bytes[0]).toBe(4);
    expect(fromHref?.mimeType).toBe('audio/ogg');
  });

  it('outro valor retorna null', async () => {
    expect(await loadFlowStepMedia('arquivo.png', 'image')).toBeNull();
    expect(await loadFlowStepMedia('flows/inicio/welcome', 'image')).toBeNull();
  });
});
