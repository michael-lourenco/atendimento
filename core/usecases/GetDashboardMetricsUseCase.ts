import { DashboardMetrics } from '../entities/Report';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';

export class GetDashboardMetricsUseCase {
  constructor(
    private messages: IMessageRepository = serviceLocator.getMessageRepository(),
    private conversations: IConversationRepository = serviceLocator.getConversationRepository()
  ) {}

  async execute(): Promise<DashboardMetrics> {
    const [allMessages, allConversations] = await Promise.all([
      this.messages.getAll(),
      this.conversations.getAll(),
    ]);

    const incoming = allMessages.filter((message) => message.direction === 'incoming').length;
    const outgoing = allMessages.filter((message) => message.direction === 'outgoing').length;
    const activeConversations = allConversations.filter(
      (conversation) => conversation.status === 'open' || conversation.status === 'waiting'
    ).length;

    return {
      totalMessages: allMessages.length,
      activeConversations,
      responseRatePercent: incoming === 0 ? 0 : Math.round((outgoing / incoming) * 100),
    };
  }
}
