import { IWhatsAppService } from '../services/IWhatsAppService';
import { WhatsAppMessageResponse } from '../services/IWhatsAppService';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';
import {
  UpsertConversationFromMessageUseCase,
  contactPhoneFromMessage,
} from './UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';

export interface SendWhatsAppMessageInput {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: string[];
  flowId?: string;
  stepId?: string;
}

export class SendWhatsAppMessageUseCase {
  constructor(
    private whatsAppService: IWhatsAppService,
    private messageRepository: IMessageRepository = serviceLocator.getMessageRepository(),
    private upsertConversation: UpsertConversationFromMessageUseCase | null = null,
    private upsertContact: UpsertContactFromIncomingUseCase | null = null
  ) {}

  async execute(input: SendWhatsAppMessageInput): Promise<Message> {
    const response: WhatsAppMessageResponse = await this.whatsAppService.sendMessage({
      to: input.to,
      message: input.message,
      type: input.type,
      templateName: input.templateName,
      templateParams: input.templateParams,
    });

    const message: Message = {
      id: response.messages[0].id,
      from: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      to: response.contacts[0].wa_id,
      content: input.message,
      type: input.type === 'template' ? 'text' : (input.type || 'text'),
      timestamp: new Date(),
      direction: 'outgoing',
      status: 'sent',
      flowId: input.flowId,
      stepId: input.stepId,
    };

    await this.messageRepository.save(message);
    await this.upsertContact?.execute(contactPhoneFromMessage(message), message.contactName);
    await this.upsertConversation?.execute(message);

    return message;
  }
}
