import { quickReplyHasMedia } from '../entities/QuickReply';
import { IQuickReplyRepository } from '../repositories/IQuickReplyRepository';
import { IMediaStorage, StoredMedia, quickReplyMediaPath } from '../services/IMediaStorage';

export class GetQuickReplyMediaUseCase {
  constructor(
    private replies: IQuickReplyRepository,
    private storage: IMediaStorage
  ) {}

  async execute(id: string): Promise<StoredMedia | null> {
    const trimmed = id.trim();
    if (!trimmed) {
      return null;
    }
    const reply = await this.replies.getById(trimmed);
    if (!reply || !quickReplyHasMedia(reply)) {
      return null;
    }
    return this.storage.get(quickReplyMediaPath(trimmed));
  }
}
