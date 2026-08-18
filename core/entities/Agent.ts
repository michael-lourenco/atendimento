export type AgentStatus = 'online' | 'offline';

export interface Agent {
  id: string;
  name: string;
  email: string;
  status: AgentStatus;
  departmentId?: string;
  conversationsCount: number;
  responseTime: string;
  createdAt: Date;
}
