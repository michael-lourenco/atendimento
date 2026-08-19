import {
  IWhatsAppService,
  OutgoingMedia,
  WhatsAppMessageResponse,
} from '../services/IWhatsAppService';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { Message } from '../entities/Message';
import {
  IMediaStorage,
  defaultOutgoingCaption,
  mediaKindFromMime,
  messageMediaPath,
} from '../services/IMediaStorage';
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
  media?: OutgoingMedia;
}

export class SendWhatsAppMessageUseCase {
  constructor(
    private whatsAppService: IWhatsAppService,
    private messageRepository: IMessageRepository = serviceLocator.getMessageRepository(),
    private upsertConversation: UpsertConversationFromMessageUseCase | null = null,
    private upsertContact: UpsertContactFromIncomingUseCase | null = null,
    private mediaStorage: IMediaStorage | null = null
  ) {}

  async execute(input: SendWhatsAppMessageInput): Promise<Message> {
    const kind = input.media ? mediaKindFromMime(input.media.mimeType) : undefined;
    const caption = input.message.trim();
    const content = caption || (kind ? defaultOutgoingCaption(kind) : '');

    const response: WhatsAppMessageResponse = await this.whatsAppService.sendMessage({
      to: input.to,
      message: caption,
      type: input.type,
      templateName: input.templateName,
      templateParams: input.templateParams,
      media: input.media,
    });

    const message: Message = {
      id: response.messages[0].id,
      from: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      to: response.contacts[0].wa_id,
      content,
      type: kind ?? (input.type === 'template' ? 'text' : input.type || 'text'),
      timestamp: new Date(),
      direction: 'outgoing',
      status: 'sent',
      flowId: input.flowId,
      stepId: input.stepId,
    };

    await this.messageRepository.save(message);
    if (input.media && this.mediaStorage) {
      try {
        await this.mediaStorage.save(messageMediaPath(message.id), {
          bytes: input.media.bytes,
          mimeType: input.media.mimeType.split(';')[0],
        });
      } catch (error) {
        console.error('Falha ao cachear mídia enviada:', error);
      }
    }
    await this.upsertContact?.execute(contactPhoneFromMessage(message), message.contactName);
    await this.upsertConversation?.execute(message);

    return message;
  }
}
