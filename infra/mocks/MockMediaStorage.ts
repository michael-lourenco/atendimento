import { IMediaStorage, StoredMedia } from '../../core/services/IMediaStorage';

export class MockMediaStorage implements IMediaStorage {
  private files = new Map<string, StoredMedia>();

  async save(path: string, media: StoredMedia): Promise<void> {
    this.files.set(path, { bytes: media.bytes, mimeType: media.mimeType });
  }

  async get(path: string): Promise<StoredMedia | null> {
    return this.files.get(path) ?? null;
  }
}

export const mockMediaStorage = new MockMediaStorage();
