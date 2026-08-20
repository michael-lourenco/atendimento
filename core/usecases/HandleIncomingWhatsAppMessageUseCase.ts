import { IWhatsAppService, WhatsAppWebhookEntry } from '../services/IWhatsAppService';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { IContactRepository } from '../repositories/IContactRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { Message } from '../entities/Message';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { mergeMessageStatus } from '../entities/messageStatus';
import { lineHintFromMessage, matchWhatsAppNumber } from '../entities/whatsappNumberLine';
import { incomingFlowHints } from '../entities/flowAudience';
import { ProcessIncomingFlowUseCase } from './ProcessIncomingFlowUseCase';
import {
  UpsertConversationFromMessageUseCase,
  contactPhoneFromMessage,
} from './UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';
import { SyncContactAvatarUseCase } from './SyncContactAvatarUseCase';

export class HandleIncomingWhatsAppMessageUseCase {
  constructor(
    private whatsAppService: IWhatsAppService,
    private messageRepository: IMessageRepository,
    private processIncomingFlow: ProcessIncomingFlowUseCase,
    private upsertConversation: UpsertConversationFromMessageUseCase,
    private upsertContact: UpsertContactFromIncomingUseCase,
    private syncAvatar?: SyncContactAvatarUseCase,
    private numbers?: IWhatsAppNumberRepository,
    private contacts?: IContactRepository,
    private conversations?: IConversationRepository
  ) {}

  async execute(entry: WhatsAppWebhookEntry): Promise<Message[]> {
    const messages = await this.whatsAppService.processWebhook(entry);
    return this.persistAndRunFlow(messages);
  }

  async executeMessages(messages: Message[]): Promise<Message[]> {
    return this.persistAndRunFlow(messages);
  }

  private async persistAndRunFlow(messages: Message[]): Promise<Message[]> {
    const catalog = this.numbers ? await this.numbers.getAll() : [];
    const hints = await this.peekFlowHints(messages, catalog);
    for (const message of messages) {
      const existing = await this.messageRepository.getById(message.id);
      if (existing) {
        message.status = mergeMessageStatus(existing.status, message.status);
        message.reactions = existing.reactions;
      }
      await this.messageRepository.save(message);
      const phone = contactPhoneFromMessage(message);
      await this.upsertContact.execute(phone, message.contactName);
      if (this.syncAvatar) {
        const line = matchWhatsAppNumber(catalog, lineHintFromMessage(message));
        try {
          await this.syncAvatar.execute(phone, line?.instanceName);
        } catch {
          // foto não bloqueia a mensagem
        }
      }
      await this.upsertConversation.execute(message);
    }

    await this.processIncomingFlow.executeForMessages(messages, hints);

    return messages;
  }

  private async peekFlowHints(messages: Message[], catalog: WhatsAppNumber[]) {
    if (!this.contacts || !this.conversations) {
      return [];
    }
    const conversations = await this.conversations.getAll();
    const existingContactIds = new Set<string>();
    const seen = new Set<string>();
    for (const message of messages) {
      const phone = contactPhoneFromMessage(message);
      if (!phone || seen.has(phone)) {
        continue;
      }
      seen.add(phone);
      if (await this.contacts.getById(phone)) {
        existingContactIds.add(phone);
      }
    }
    return incomingFlowHints({
      messages,
      conversations,
      existingContactIds,
      catalog,
    });
  }
}
