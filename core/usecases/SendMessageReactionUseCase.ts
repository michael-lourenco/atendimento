import { Message } from '../entities/Message';
import { reactionPeerOf, reactionSenderOf, reactionTogglesOff } from '../entities/messageReaction';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppService } from '../services/IWhatsAppService';
import { ApplyMessageReactionUseCase } from './ApplyMessageReactionUseCase';

export type SendMessageReactionInput = {
  messageId: string;
  emoji: string;
};

export class SendMessageReactionUseCase {
  private applyReaction: ApplyMessageReactionUseCase;

  constructor(
    private whatsApp: IWhatsAppService,
    private messages: IMessageRepository
  ) {
    this.applyReaction = new ApplyMessageReactionUseCase(messages);
  }

  async execute(input: SendMessageReactionInput): Promise<Message | null> {
    if (!this.whatsApp.sendReaction) {
      throw new Error('Reações pelo painel só estão disponíveis com Evolution ou Meta nesta versão.');
    }
    const messageId = input.messageId.trim();
    const existing = await this.messages.getById(messageId);
    if (!existing) {
      return null;
    }
    const from = reactionSenderOf(existing);
    const emoji = reactionTogglesOff(existing.reactions, from, input.emoji)
      ? ''
      : input.emoji.trim();
    await this.whatsApp.sendReaction({
      to: reactionPeerOf(existing),
      messageId: existing.id,
      emoji,
      fromMe: existing.direction === 'outgoing',
      instanceName: from,
    });
    return this.applyReaction.execute({ targetId: existing.id, from, emoji });
  }
}
