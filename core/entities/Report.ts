export type ReportType = 'monthly' | 'conversations' | 'custom';

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  period: string;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalMessages: number;
  activeConversations: number;
  responseRatePercent: number;
}
