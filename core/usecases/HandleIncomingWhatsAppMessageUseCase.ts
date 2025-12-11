import { IWhatsAppService, WhatsAppWebhookEntry } from '../services/IWhatsAppService';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';

export class HandleIncomingWhatsAppMessageUseCase {
  private whatsAppService: IWhatsAppService;

  constructor(whatsAppService?: IWhatsAppService) {
    this.whatsAppService = whatsAppService || serviceLocator.getWhatsAppService();
  }

  async execute(entry: WhatsAppWebhookEntry): Promise<Message[]> {
    // Processar webhook e converter para entidades Message
    const messages = await this.whatsAppService.processWebhook(entry);

    // Salvar todas as mensagens no repositório
    const messageRepository = serviceLocator.getMessageRepository();
    for (const message of messages) {
      await messageRepository.save(message);
    }

    // TODO: Aqui você pode adicionar lógica de fluxos
    // Por exemplo, processar a mensagem e determinar qual resposta enviar
    // baseado nos fluxos configurados

    return messages;
  }
}



