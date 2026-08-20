import { DashboardMetrics } from '../entities/Report';
import { IConversationRepository } from '../repositories/IConversationRepository';
import { IMessageRepository } from '../repositories/IMessageRepository';
import { IWhatsAppNumberRepository } from '../repositories/IWhatsAppNumberRepository';
import { avgFirstHumanReplyMinutes, unassignedOlderThanMinutes } from '../entities/slaMetrics';

export function conversationsByDepartment(
  conversations: { departmentName?: string }[]
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const conversation of conversations) {
    const name = conversation.departmentName?.trim() || 'Sem setor';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export function avgAssumeMinutes(
  conversations: { createdAt: Date; assignedAt?: Date }[]
): number | null {
  const assumed = conversations.filter((item) => item.assignedAt);
  if (assumed.length === 0) {
    return null;
  }
  const totalMs = assumed.reduce(
    (sum, item) => sum + (item.assignedAt!.getTime() - item.createdAt.getTime()),
    0
  );
  return Math.max(0, Math.round(totalMs / assumed.length / 60000));
}

export class GetDashboardMetricsUseCase {
  constructor(
    private messages: IMessageRepository,
    private conversations: IConversationRepository,
    private numbers: IWhatsAppNumberRepository
  ) {}

  async execute(): Promise<DashboardMetrics> {
    const [allMessages, allConversations, numberList] = await Promise.all([
      this.messages.getAll(),
      this.conversations.getAll(),
      this.numbers.getAll(),
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
      conversationsByDepartment: conversationsByDepartment(allConversations),
      avgAssumeMinutes: avgAssumeMinutes(allConversations),
      avgFirstHumanReplyMinutes: avgFirstHumanReplyMinutes(
        allConversations,
        allMessages,
        numberList
      ),
      unassignedOlderThanMinutes: unassignedOlderThanMinutes(allConversations),
    };
  }
}
