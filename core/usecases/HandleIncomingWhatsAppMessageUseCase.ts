import { IWhatsAppService, WhatsAppWebhookEntry } from '../services/IWhatsAppService';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { Message } from '../entities/Message';
import { ProcessIncomingFlowUseCase } from './ProcessIncomingFlowUseCase';
import {
  UpsertConversationFromMessageUseCase,
  contactPhoneFromMessage,
} from './UpsertConversationFromMessageUseCase';
import { UpsertContactFromIncomingUseCase } from './UpsertContactFromIncomingUseCase';

export class HandleIncomingWhatsAppMessageUseCase {
  constructor(
    private whatsAppService: IWhatsAppService,
    private messageRepository: IMessageRepository,
    private processIncomingFlow: ProcessIncomingFlowUseCase,
    private upsertConversation: UpsertConversationFromMessageUseCase,
    private upsertContact: UpsertContactFromIncomingUseCase
  ) {}

  async execute(entry: WhatsAppWebhookEntry): Promise<Message[]> {
    const messages = await this.whatsAppService.processWebhook(entry);
    return this.persistAndRunFlow(messages);
  }

  async executeMessages(messages: Message[]): Promise<Message[]> {
    return this.persistAndRunFlow(messages);
  }

  private async persistAndRunFlow(messages: Message[]): Promise<Message[]> {
    for (const message of messages) {
      await this.messageRepository.save(message);
      await this.upsertContact.execute(
        contactPhoneFromMessage(message),
        message.contactName
      );
      await this.upsertConversation.execute(message);
    }

    await this.processIncomingFlow.executeForMessages(messages);

    return messages;
  }
}
