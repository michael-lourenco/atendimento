import { NextRequest } from 'next/server';
import { Flow } from '@/core/entities/Flow';
import { IFlowRepository } from '@/core/repositories/IFlowRepository';
import { IMediaStorage, StoredMedia } from '@/core/services/IMediaStorage';
import { DELETE, GET, PUT } from './route';

jest.mock('server-only', () => ({}));

const isPublicSupabaseConfigured = jest.fn(() => false);
const getOperatorUser = jest.fn();

jest.mock('@/infra/supabase/env', () => ({
  isPublicSupabaseConfigured: () => isPublicSupabaseConfigured(),
}));

jest.mock('@/infra/supabase/getOperatorUser', () => ({
  getOperatorUser: () => getOperatorUser(),
}));

jest.mock('@/infra/http/apiLog', () => ({
  logApiError: jest.fn(),
}));

const now = new Date('2026-08-20T12:00:00Z');

const sampleFlow = (): Flow => ({
  id: 'inicio',
  name: 'Entrada',
  isActive: true,
  createdAt: now,
  updatedAt: now,
  steps: [{ id: 'welcome', type: 'message', content: 'Olá' }],
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

const flows = new MemoryFlows([sampleFlow()]);
const storage = new MemoryStorage();

jest.mock('@/infra/adapters/serverLocator', () => ({
  serverLocator: {
    getRepos: () => ({ flow: flows }),
    getMediaStorage: () => storage,
  },
}));

function params(flowId = 'inicio', stepId = 'welcome') {
  return { params: Promise.resolve({ flowId, stepId }) };
}

describe('flow step media route', () => {
  beforeEach(() => {
    isPublicSupabaseConfigured.mockReturnValue(false);
    getOperatorUser.mockReset();
    flows.items = [sampleFlow()];
    storage.files.clear();
  });

  it('401 sem sessão quando o Supabase está configurado', async () => {
    isPublicSupabaseConfigured.mockReturnValue(true);
    getOperatorUser.mockResolvedValue(null);
    const response = await GET(
      new NextRequest('http://localhost/api/flows/inicio/steps/welcome/media'),
      params()
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Não autenticado' });
  });

  it('404 se o objeto não existe', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/flows/inicio/steps/welcome/media'),
      params()
    );
    expect(response.status).toBe(404);
  });

  it('400 sem file no PUT', async () => {
    const form = new FormData();
    const response = await PUT(
      new NextRequest('http://localhost/api/flows/inicio/steps/welcome/media', {
        method: 'PUT',
        body: form,
      }),
      params()
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: 'Campo obrigatório: file' });
  });

  it('200 no PUT grava e o GET devolve bytes', async () => {
    const form = new FormData();
    form.set('file', new File([new Uint8Array([9, 8])], 'foto.png', { type: 'image/png' }));
    const put = await PUT(
      new NextRequest('http://localhost/api/flows/inicio/steps/welcome/media', {
        method: 'PUT',
        body: form,
      }),
      params()
    );
    expect(put.status).toBe(200);
    const body = (await put.json()) as Flow;
    expect(body.steps[0].mediaUrl).toBe('flows/inicio/welcome');
    expect(body.steps[0].mediaKind).toBe('image');

    const get = await GET(
      new NextRequest('http://localhost/api/flows/inicio/steps/welcome/media'),
      params()
    );
    expect(get.status).toBe(200);
    expect(get.headers.get('Content-Type')).toBe('image/png');
  });

  it('200 no DELETE limpa o passo', async () => {
    await storage.save('flows/inicio/welcome', {
      bytes: new Uint8Array([1]),
      mimeType: 'image/png',
    });
    flows.items[0].steps[0] = {
      ...flows.items[0].steps[0],
      mediaUrl: 'flows/inicio/welcome',
      mediaKind: 'image',
    };
    const response = await DELETE(
      new NextRequest('http://localhost/api/flows/inicio/steps/welcome/media', {
        method: 'DELETE',
      }),
      params()
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Flow;
    expect(body.steps[0].mediaUrl).toBeUndefined();
  });
});
