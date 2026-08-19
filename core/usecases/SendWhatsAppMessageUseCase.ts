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
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { outgoingWhatsAppLine } from '../entities/whatsappNumberLine';
import { conversationFromInboxQuery } from '../entities/conversationThread';

export interface SendWhatsAppMessageInput {
  to: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
  templateParams?: string[];
  flowId?: string;
  stepId?: string;
  media?: OutgoingMedia;
  instanceName?: string;
  conversationId?: string;
}

export class SendWhatsAppMessageUseCase {
  constructor(
    private whatsAppService: IWhatsAppService,
    private messageRepository: IMessageRepository = serviceLocator.getMessageRepository(),
    private upsertConversation: UpsertConversationFromMessageUseCase | null = null,
    private upsertContact: UpsertContactFromIncomingUseCase | null = null,
    private mediaStorage: IMediaStorage | null = null,
    private conversations: IConversationRepository | null = null,
    private numbers: IWhatsAppNumberRepository | null = null
  ) {}

  async execute(input: SendWhatsAppMessageInput): Promise<Message> {
    const kind = input.media ? mediaKindFromMime(input.media.mimeType) : undefined;
    const caption = input.message.trim();
    const content = caption || (kind ? defaultOutgoingCaption(kind) : '');
    const line = await this.resolveLine(input);

    const response: WhatsAppMessageResponse = await this.whatsAppService.sendMessage({
      to: input.to,
      message: caption,
      type: input.type,
      templateName: input.templateName,
      templateParams: input.templateParams,
      media: input.media,
      instanceName: line.instanceName,
    });

    const message: Message = {
      id: response.messages[0].id,
      from: line.from,
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
      } catch {
        console.error('Falha ao cachear mídia enviada');
      }
    }
    await this.upsertContact?.execute(contactPhoneFromMessage(message), message.contactName);
    await this.upsertConversation?.execute(message);

    return message;
  }

  private async resolveLine(input: SendWhatsAppMessageInput): Promise<{ instanceName?: string; from: string }> {
    if (input.instanceName) {
      return { instanceName: input.instanceName, from: input.instanceName };
    }
    const conversations = this.conversations ?? serviceLocator.getConversationRepository();
    const numbers = this.numbers ?? serviceLocator.getWhatsAppNumberRepository();
    const catalog = await numbers.getAll();
    if (input.conversationId) {
      const byId = await conversations.getById(input.conversationId);
      const line = outgoingWhatsAppLine(byId, catalog);
      return {
        instanceName: line.instanceName,
        from: line.number?.number || line.instanceName,
      };
    }
    const phone = input.to.replace(/\D/g, '') || input.to;
    const listed = await conversations.getAll();
    const conversation =
      (await conversations.getById(phone)) ??
      conversationFromInboxQuery(listed, { contactPhone: phone });
    const line = outgoingWhatsAppLine(conversation, catalog);
    return {
      instanceName: line.instanceName,
      from: line.number?.number || line.instanceName,
    };
  }
}
