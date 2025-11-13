export interface Department {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  agentsCount: number;
  conversationsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

