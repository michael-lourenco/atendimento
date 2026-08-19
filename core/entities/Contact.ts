export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
