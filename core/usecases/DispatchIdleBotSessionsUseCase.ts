import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { WhatsAppNumber } from '../entities/WhatsAppNumber';
import { isBotIdleQuestion, lastIncomingTimestamp } from '../entities/botIdle';
import { resolveBotBehavior } from '../entities/botBehavior';
import { digitsPhone, messagesOnWhatsAppLine } from '../entities/conversationThread';
import { IChatbotRepository } from '../repositories/IChatbotRepository';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IFlowSessionRepository } from '../repositories/IFlowSessionRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { contactPhoneFromMessage } from './UpsertConversationFromMessageUseCase';
import { CloseConversationUseCase } from './CloseConversationUseCase';
import { SendWhatsAppMessageUseCase } from './SendWhatsAppMessageUseCase';

export class DispatchIdleBotSessionsUseCase {
  constructor(
    private chatbots: IChatbotRepository,
    private conversations: IConversationRepository,
    private sessions: IFlowSessionRepository,
    private messages: IMessageRepository,
    private sendMessage: SendWhatsAppMessageUseCase,
    private closeConversation: CloseConversationUseCase,
    private numbers: IWhatsAppNumberRepository | null = null
  ) {}

  async execute(now = new Date()): Promise<{ closed: string[] }> {
    const behavior = resolveBotBehavior(await this.chatbots.getAll());
    if (behavior.idleContactMinutes <= 0) {
      return { closed: [] };
    }
    const thresholdMs = behavior.idleContactMinutes * 60 * 1000;
    const [allConversations, allMessages, catalog] = await Promise.all([
      this.conversations.getAll(),
      this.messages.getAll(),
      this.numbers ? this.numbers.getAll() : Promise.resolve([]),
    ]);
    const closed: string[] = [];
    for (const conversation of allConversations) {
      if (conversation.status === 'closed') {
        continue;
      }
      const session = await this.sessions.getByContactId(conversation.id);
      if (!session || !isBotIdleQuestion(session)) {
        continue;
      }
      const line = catalog.find((item) => item.id === conversation.whatsappNumberId) ?? null;
      const lastIncoming = lastIncomingTimestamp(
        conversation,
        messagesForThread(allMessages, conversation, line)
      );
      if (!lastIncoming || now.getTime() - lastIncoming.getTime() < thresholdMs) {
        continue;
      }
      const text = behavior.idleCloseMessage.trim();
      if (text) {
        await this.sendMessage.execute({
          to: conversation.contactPhone,
          message: text,
          conversationId: conversation.id,
          instanceName: line?.instanceName,
        });
      }
      await this.closeConversation.execute(conversation.id);
      await this.sessions.save({
        ...session,
        paused: true,
        updatedAt: now,
      });
      closed.push(conversation.id);
    }
    return { closed };
  }
}

function messagesForThread(
  messages: Message[],
  conversation: Conversation,
  line: WhatsAppNumber | null
): Message[] {
  const phone = digitsPhone(conversation.contactPhone);
  const samePhone = messages.filter(
    (item) => digitsPhone(contactPhoneFromMessage(item)) === phone
  );
  return messagesOnWhatsAppLine(samePhone, line);
}
