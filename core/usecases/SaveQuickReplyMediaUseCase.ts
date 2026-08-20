import { QuickReply } from '../entities/QuickReply';
import { IQuickReplyRepository } from '../repositories/IQuickReplyRepository';
import {
  IMediaStorage,
  MAX_OUTGOING_MEDIA_BYTES,
  StoredMedia,
  mediaKindFromMime,
  quickReplyMediaPath,
} from '../services/IMediaStorage';

export class InvalidQuickReplyMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidQuickReplyMediaError';
  }
}

export class SaveQuickReplyMediaUseCase {
  constructor(
    private replies: IQuickReplyRepository,
    private storage: IMediaStorage | null = null
  ) {}

  async execute(id: string, media: StoredMedia | null): Promise<QuickReply | null> {
    const existing = await this.replies.getById(id.trim());
    if (!existing) {
      return null;
    }
    if (!media) {
      const cleared: QuickReply = { ...existing, mediaKind: undefined };
      await this.replies.save(cleared);
      return cleared;
    }
    if (media.bytes.byteLength > MAX_OUTGOING_MEDIA_BYTES) {
      throw new InvalidQuickReplyMediaError('Arquivo maior que 16 MB');
    }
    if (mediaKindFromMime(media.mimeType) !== 'audio') {
      throw new InvalidQuickReplyMediaError('Só é permitido áudio');
    }
    if (!this.storage) {
      throw new InvalidQuickReplyMediaError('Storage de mídia indisponível');
    }
    await this.storage.save(quickReplyMediaPath(existing.id), media);
    const updated: QuickReply = { ...existing, mediaKind: 'audio' };
    await this.replies.save(updated);
    return updated;
  }
}
