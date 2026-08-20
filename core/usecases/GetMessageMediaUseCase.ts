import { mediaLookupFromMessage } from '../entities/messageMediaLookup';
import { IMessageRepository } from '../repositories/IMessageRepository';
import {
  IMediaStorage,
  StoredMedia,
  isPlayableMediaType,
  messageMediaPath,
} from '../services/IMediaStorage';
import { IWhatsAppService } from '../services/IWhatsAppService';

export class GetMessageMediaUseCase {
  constructor(
    private messages: IMessageRepository,
    private storage: IMediaStorage,
    private whatsApp: IWhatsAppService
  ) {}

  async execute(id: string): Promise<StoredMedia | null> {
    const trimmed = id.trim();
    if (!trimmed) {
      return null;
    }
    const message = await this.messages.getById(trimmed);
    if (!message || !isPlayableMediaType(message.type)) {
      return null;
    }
    const path = messageMediaPath(message.id);
    const cached = await this.storage.get(path);
    if (cached) {
      return cached;
    }
    if (!this.whatsApp.downloadMedia) {
      return null;
    }
    try {
      const lookup = mediaLookupFromMessage(message);
      const file = await this.whatsApp.downloadMedia({
        messageId: message.id,
        convertToMp4: message.type === 'video',
        remoteJid: lookup.remoteJid,
        fromMe: lookup.fromMe,
      });
      if (file) {
        try {
          await this.storage.save(path, file);
        } catch {
          console.error('Falha ao cachear mídia');
        }
      }
      return file;
    } catch {
      console.error('Falha ao obter mídia');
      return null;
    }
  }
}
