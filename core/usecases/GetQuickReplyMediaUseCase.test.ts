import { QuickReply } from '../entities/QuickReply';
import { IQuickReplyRepository } from '../repositories/IQuickReplyRepository';
import { IMediaStorage, StoredMedia } from '../services/IMediaStorage';
import { GetQuickReplyMediaUseCase } from './GetQuickReplyMediaUseCase';

const sample: QuickReply = {
  id: 'qr-1',
  title: 'Saudação',
  body: '',
  mediaKind: 'image',
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
  async save() {}
  async delete() {}
}

class MemoryStorage implements IMediaStorage {
  constructor(private file: StoredMedia | null) {}
  async save() {}
  async get() {
    return this.file;
  }
  async remove() {}
}

describe('GetQuickReplyMediaUseCase', () => {
  it('lê a mídia gravada', async () => {
    const file = { bytes: new Uint8Array([1]), mimeType: 'image/png' };
    const result = await new GetQuickReplyMediaUseCase(
      new MemoryReplies([{ ...sample }]),
      new MemoryStorage(file)
    ).execute('qr-1');
    expect(result).toEqual(file);
  });

  it('sem mídia retorna null', async () => {
    const result = await new GetQuickReplyMediaUseCase(
      new MemoryReplies([{ ...sample, mediaKind: undefined }]),
      new MemoryStorage({ bytes: new Uint8Array([1]), mimeType: 'image/png' })
    ).execute('qr-1');
    expect(result).toBeNull();
  });
});
