export type StoredMedia = {
  bytes: Uint8Array;
  mimeType: string;
};

export interface IMediaStorage {
  save(path: string, media: StoredMedia): Promise<void>;
  get(path: string): Promise<StoredMedia | null>;
}

export function messageMediaPath(messageId: string): string {
  return `messages/${messageId}`;
}

export function isPlayableMediaType(type: string): boolean {
  return type === 'image' || type === 'audio' || type === 'video' || type === 'document';
}
