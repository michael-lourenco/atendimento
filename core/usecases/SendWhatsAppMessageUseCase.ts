import { IWhatsAppService } from '../services/IWhatsAppService';
import { WhatsAppMessageResponse } from '../services/IWhatsAppService';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';

export interface SendWhatsAppMessageInput {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: string[];
}

export class SendWhatsAppMessageUseCase {
  private whatsAppService: IWhatsAppService;

  constructor(whatsAppService?: IWhatsAppService) {
    this.whatsAppService = whatsAppService || serviceLocator.getWhatsAppService();
  }

  async execute(input: SendWhatsAppMessageInput): Promise<Message> {
    // Enviar mensagem via WhatsApp
    const response: WhatsAppMessageResponse = await this.whatsAppService.sendMessage({
      to: input.to,
      message: input.message,
      type: input.type,
      templateName: input.templateName,
      templateParams: input.templateParams,
    });

    // Salvar mensagem no repositório
    const message: Message = {
      id: response.messages[0].id,
      from: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      to: response.contacts[0].wa_id,
      content: input.message,
      type: input.type === 'template' ? 'text' : (input.type || 'text'),
      timestamp: new Date(),
      direction: 'outgoing',
      status: 'sent',
    };

    const messageRepository = serviceLocator.getMessageRepository();
    await messageRepository.save(message);

    return message;
  }
}




