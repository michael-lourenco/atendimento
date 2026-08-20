import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class WhatsAppNumberCatalogUseCase extends CatalogUseCase<WhatsAppNumber> {
  constructor(repo: IWhatsAppNumberRepository) {
    super(repo);
  }
}
