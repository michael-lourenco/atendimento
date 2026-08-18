import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class WhatsAppNumberCatalogUseCase extends CatalogUseCase<WhatsAppNumber> {
  constructor(repo: IWhatsAppNumberRepository = serviceLocator.getWhatsAppNumberRepository()) {
    super(repo);
  }
}
