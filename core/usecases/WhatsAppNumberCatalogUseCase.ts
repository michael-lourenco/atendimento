import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { IFlowRepository } from '../repositories/IFlowRepository';
import { CatalogUseCase } from './CatalogUseCase';
import { assertHealthyEntryFlow } from './PublishFlowUseCase';

export class WhatsAppNumberCatalogUseCase extends CatalogUseCase<WhatsAppNumber> {
  constructor(
    repo: IWhatsAppNumberRepository,
    private flows: IFlowRepository | null = null
  ) {
    super(repo);
  }

  async save(entity: WhatsAppNumber): Promise<void> {
    if (this.flows) {
      assertHealthyEntryFlow(entity.flowId, await this.flows.getAll());
    }
    return super.save(entity);
  }
}
