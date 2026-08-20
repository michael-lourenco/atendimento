import { IConversationRepository } from '../repositories/IConversationRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { findConversationThread } from '../entities/conversationThread';
import { matchWhatsAppNumber } from '../entities/whatsappNumberLine';

export class ApplyContactTypingUseCase {
  constructor(
    private conversations: IConversationRepository,
    private numbers: IWhatsAppNumberRepository
  ) {}

  async execute(input: {
    phone: string;
    instanceName: string;
    composing: boolean;
  }): Promise<void> {
    const catalog = await this.numbers.getAll();
    const line = matchWhatsAppNumber(catalog, input.instanceName);
    const thread = findConversationThread(
      await this.conversations.getAll(),
      input.phone,
      line?.id
    );
    if (!thread) {
      return;
    }
    await this.conversations.save({
      ...thread,
      contactTypingAt: input.composing ? new Date() : undefined,
    });
  }
}
