import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import {
  LiveWhatsAppInfo,
  liveWhatsAppNumberForCatalog,
  liveWhatsAppNumberNeedsSave,
} from '../entities/whatsappNumberLive';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';

export class SyncLiveWhatsAppNumberUseCase {
  constructor(
    private numbers: IWhatsAppNumberRepository
  ) {}

  async execute(live: LiveWhatsAppInfo): Promise<WhatsAppNumber | null> {
    const catalog = await this.numbers.getAll();
    const next = liveWhatsAppNumberForCatalog(catalog, live);
    if (!next) return null;
    const existing = catalog.find((row) => row.id === next.id);
    if (!liveWhatsAppNumberNeedsSave(existing, next)) {
      return existing ?? next;
    }
    await this.numbers.save(next);
    return next;
  }
}
