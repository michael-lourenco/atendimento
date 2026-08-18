export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
