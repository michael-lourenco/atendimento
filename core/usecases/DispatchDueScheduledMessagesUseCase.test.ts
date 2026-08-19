import { ScheduledMessage } from '../entities/ScheduledMessage';
import { IScheduledMessageRepository } from '../repositories/IScheduledMessageRepository';
import { DispatchDueScheduledMessagesUseCase } from './DispatchDueScheduledMessagesUseCase';

class MemorySchedules implements IScheduledMessageRepository {
  constructor(public items: ScheduledMessage[]) {}
  async getAll() {
    return [...this.items];
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(entity: ScheduledMessage) {
    const index = this.items.findIndex((item) => item.id === entity.id);
    if (index >= 0) this.items[index] = entity;
    else this.items.push(entity);
  }
  async delete(id: string) {
    this.items = this.items.filter((item) => item.id !== id);
  }
}

const now = new Date('2026-08-18T15:00:00');

const row = (overrides: Partial<ScheduledMessage> = {}): ScheduledMessage => ({
  id: 's1',
  contact: '5511999887766',
  message: 'Lembrete',
  scheduledDate: new Date('2026-08-18T12:00:00'),
  status: 'pending',
  createdAt: new Date('2026-08-18T10:00:00'),
  ...overrides,
});

describe('DispatchDueScheduledMessagesUseCase', () => {
  it('envia pendente vencido e marca sent', async () => {
    const repo = new MemorySchedules([row()]);
    const sent: string[] = [];
    const paused: string[] = [];
    const result = await new DispatchDueScheduledMessagesUseCase(
      repo,
      {
        execute: async (input) => {
          sent.push(input.to);
        },
      },
      {
        execute: async (contactId) => {
          paused.push(contactId);
        },
      }
    ).execute(now);

    expect(result.sent).toEqual(['s1']);
    expect(sent).toEqual(['5511999887766']);
    expect(paused).toEqual(['5511999887766']);
    expect(repo.items[0].status).toBe('sent');
  });

  it('não envia o que ainda é futuro', async () => {
    const repo = new MemorySchedules([
      row({ scheduledDate: new Date('2026-08-19T12:00:00') }),
    ]);
    let calls = 0;
    await new DispatchDueScheduledMessagesUseCase(
      repo,
      {
        execute: async () => {
          calls += 1;
        },
      },
      { execute: async () => undefined }
    ).execute(now);
    expect(calls).toBe(0);
    expect(repo.items[0].status).toBe('pending');
  });

  it('marca failed se a mensagem estiver vazia', async () => {
    const repo = new MemorySchedules([row({ message: '   ' })]);
    let calls = 0;
    await new DispatchDueScheduledMessagesUseCase(
      repo,
      {
        execute: async () => {
          calls += 1;
        },
      },
      { execute: async () => undefined }
    ).execute(now);
    expect(calls).toBe(0);
    expect(repo.items[0].status).toBe('failed');
  });

  it('marca failed se o provedor recusar', async () => {
    const repo = new MemorySchedules([row()]);
    await new DispatchDueScheduledMessagesUseCase(
      repo,
      {
        execute: async () => {
          throw new Error('evolution');
        },
      },
      { execute: async () => undefined }
    ).execute(now);
    expect(repo.items[0].status).toBe('failed');
  });
});
