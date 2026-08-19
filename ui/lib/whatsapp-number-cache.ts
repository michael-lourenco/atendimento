import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { WhatsAppNumberCatalogUseCase } from '@/core/usecases/WhatsAppNumberCatalogUseCase';
import { createListCache } from '@/ui/lib/ttl-list-cache';

const WHATSAPP_NUMBER_CACHE_MS = 60_000;
const cache = createListCache<WhatsAppNumber>(WHATSAPP_NUMBER_CACHE_MS);

export function invalidateWhatsAppNumberCache() {
  cache.invalidate();
}

export function listWhatsAppNumbersCached(): Promise<WhatsAppNumber[]> {
  return cache.list(() => new WhatsAppNumberCatalogUseCase().list());
}
