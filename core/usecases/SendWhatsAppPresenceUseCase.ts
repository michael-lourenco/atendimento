import { IWhatsAppService, PresenceKind } from '../services/IWhatsAppService';

export class SendWhatsAppPresenceUseCase {
  constructor(private whatsApp: IWhatsAppService) {}

  async execute(input: {
    to: string;
    presence: PresenceKind;
    instanceName?: string;
  }): Promise<void> {
    await this.whatsApp.sendPresence?.({
      to: input.to,
      presence: input.presence,
      instanceName: input.instanceName,
      delayMs:
        input.presence === 'paused' ? 0 : input.presence === 'recording' ? 25000 : 2000,
    });
  }
}
