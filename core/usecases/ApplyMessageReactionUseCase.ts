import { Message } from '../entities/Message';
import { applyMessageReaction } from '../entities/messageReaction';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export type ApplyMessageReactionInput = {
  targetId: string;
  from: string;
  emoji: string;
};

export class ApplyMessageReactionUseCase {
  constructor(private messages: IMessageRepository = serviceLocator.getMessageRepository()) {}

  async execute(input: ApplyMessageReactionInput): Promise<Message | null> {
    const existing = await this.messages.getById(input.targetId.trim());
    if (!existing) {
      return null;
    }
    const updated: Message = {
      ...existing,
      reactions: applyMessageReaction(existing.reactions, input.from, input.emoji),
    };
    await this.messages.save(updated);
    return updated;
  }
}
