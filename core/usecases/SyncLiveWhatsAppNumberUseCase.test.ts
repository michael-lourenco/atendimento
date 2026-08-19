import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { liveWhatsAppCatalogId } from '../entities/whatsappNumberLive';
import { SyncLiveWhatsAppNumberUseCase } from './SyncLiveWhatsAppNumberUseCase';

class MemoryNumbers implements IWhatsAppNumberRepository {
  items: WhatsAppNumber[] = [];
  saves = 0;

  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: WhatsAppNumber) {
    this.saves += 1;
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

const live = {
  connected: true,
  wid: '5511999887766@s.whatsapp.net',
  pushname: 'Atimo',
  platform: 'evolution',
};

describe('SyncLiveWhatsAppNumberUseCase', () => {
  it('grava o número na primeira conexão', async () => {
    const repo = new MemoryNumbers();
    const saved = await new SyncLiveWhatsAppNumberUseCase(repo).execute(live);
    expect(saved?.id).toBe(liveWhatsAppCatalogId('5511999887766'));
    expect(saved?.number).toBe('5511999887766');
    expect(saved?.name).toBe('Atimo');
    expect(saved?.status).toBe('active');
    expect(repo.saves).toBe(1);
  });

  it('não grava de novo se o cadastro já está igual', async () => {
    const repo = new MemoryNumbers();
    const useCase = new SyncLiveWhatsAppNumberUseCase(repo);
    await useCase.execute(live);
    await useCase.execute(live);
    expect(repo.saves).toBe(1);
    expect(repo.items).toHaveLength(1);
  });

  it('não grava se a sessão não estiver conectada', async () => {
    const repo = new MemoryNumbers();
    const saved = await new SyncLiveWhatsAppNumberUseCase(repo).execute({
      ...live,
      connected: false,
    });
    expect(saved).toBeNull();
    expect(repo.saves).toBe(0);
  });

  it('atualiza o cadastro que já tem o mesmo número', async () => {
    const repo = new MemoryNumbers();
    repo.items.push({
      id: 'n-1',
      name: 'Loja',
      number: '5511999887766',
      status: 'inactive',
      provider: 'meta',
      createdAt: new Date('2026-01-01'),
    });
    const saved = await new SyncLiveWhatsAppNumberUseCase(repo).execute(live);
    expect(saved?.id).toBe('n-1');
    expect(saved?.status).toBe('active');
    expect(saved?.name).toBe('Atimo');
    expect(repo.items).toHaveLength(1);
  });
});
