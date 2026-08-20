import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';
import { IMediaStorage, StoredMedia } from '../../core/services/IMediaStorage';

const BUCKET = 'media';

export class SupabaseMediaStorage implements IMediaStorage {
  constructor(private client: SupabaseClient) {}

  async save(path: string, media: StoredMedia): Promise<void> {
    const body = Buffer.from(media.bytes);
    const { error } = await this.client.storage.from(BUCKET).upload(path, body, {
      contentType: media.mimeType,
      upsert: true,
    });
    if (error) {
      throw error;
    }
  }

  async get(path: string): Promise<StoredMedia | null> {
    const { data, error } = await this.client.storage.from(BUCKET).download(path);
    if (error || !data) {
      return null;
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    const mimeType = data.type && data.type !== 'application/octet-stream' ? data.type : 'application/octet-stream';
    return { bytes, mimeType };
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.client.storage.from(BUCKET).remove([path]);
    if (error) {
      throw error;
    }
  }
}
