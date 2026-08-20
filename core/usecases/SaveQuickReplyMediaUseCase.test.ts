import { QuickReply } from '../entities/QuickReply';
import { IQuickReplyRepository } from '../repositories/IQuickReplyRepository';
import { IMediaStorage, StoredMedia } from '../services/IMediaStorage';
import {
  InvalidQuickReplyMediaError,
  SaveQuickReplyMediaUseCase,
} from './SaveQuickReplyMediaUseCase';

const sample: QuickReply = {
  id: 'qr-1',
  title: 'Saudação',
  body: 'Olá',
  createdAt: new Date('2026-08-20'),
};

class MemoryReplies implements IQuickReplyRepository {
  constructor(public items: QuickReply[]) {}
  async getAll() {
    return this.items;
  }
  async getById(id: string) {
    return this.items.find((item) => item.id === id) ?? null;
  }
  async save(reply: QuickReply) {
    this.items = [...this.items.filter((item) => item.id !== reply.id), reply];
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
}

describe('SaveQuickReplyMediaUseCase', () => {
  it('grava áudio e marca mediaKind', async () => {
    const replies = new MemoryReplies([{ ...sample }]);
    const storage = new MemoryStorage();
    const updated = await new SaveQuickReplyMediaUseCase(replies, storage).execute('qr-1', {
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'audio/ogg',
    });
    expect(updated?.mediaKind).toBe('audio');
    expect(storage.files.get('quick-replies/qr-1')?.mimeType).toBe('audio/ogg');
  });

  it('recusa arquivo que não é áudio', async () => {
    const replies = new MemoryReplies([{ ...sample }]);
    await expect(
      new SaveQuickReplyMediaUseCase(replies, new MemoryStorage()).execute('qr-1', {
        bytes: new Uint8Array([1]),
        mimeType: 'image/png',
      })
    ).rejects.toBeInstanceOf(InvalidQuickReplyMediaError);
    expect(replies.items[0].mediaKind).toBeUndefined();
  });

  it('id inexistente retorna null', async () => {
    const result = await new SaveQuickReplyMediaUseCase(
      new MemoryReplies([{ ...sample }]),
      new MemoryStorage()
    ).execute('missing', { bytes: new Uint8Array([1]), mimeType: 'audio/ogg' });
    expect(result).toBeNull();
  });

  it('null remove mediaKind', async () => {
    const replies = new MemoryReplies([{ ...sample, mediaKind: 'audio' }]);
    const updated = await new SaveQuickReplyMediaUseCase(replies, new MemoryStorage()).execute(
      'qr-1',
      null
    );
    expect(updated?.mediaKind).toBeUndefined();
  });
});
