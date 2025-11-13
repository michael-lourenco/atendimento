import { Department } from '../../core/entities/Department';

export interface IDepartmentRepository {
  getAll(): Promise<Department[]>;
  getById(id: string): Promise<Department | null>;
  save(department: Department): Promise<void>;
  delete(id: string): Promise<void>;
}

export class MockDepartmentRepository implements IDepartmentRepository {
  private departments: Department[] = [
    {
      id: '1',
      name: 'Vendas',
      description: 'Setor de vendas e prospecção',
      color: '#3b82f6',
      isActive: true,
      agentsCount: 3,
      conversationsCount: 15,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Suporte',
      description: 'Atendimento técnico e suporte',
      color: '#10b981',
      isActive: true,
      agentsCount: 5,
      conversationsCount: 28,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '3',
      name: 'Financeiro',
      description: 'Cobrança e questões financeiras',
      color: '#f59e0b',
      isActive: true,
      agentsCount: 2,
      conversationsCount: 8,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  async getAll(): Promise<Department[]> {
    return Promise.resolve(this.departments);
  }

  async getById(id: string): Promise<Department | null> {
    const department = this.departments.find(d => d.id === id);
    return Promise.resolve(department || null);
  }

  async save(department: Department): Promise<void> {
    const existingIndex = this.departments.findIndex(d => d.id === department.id);
    if (existingIndex >= 0) {
      this.departments[existingIndex] = { ...department, updatedAt: new Date() };
    } else {
      this.departments.push({
        ...department,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return Promise.resolve();
  }

  async delete(id: string): Promise<void> {
    this.departments = this.departments.filter(d => d.id !== id);
    return Promise.resolve();
  }
}

export const mockDepartmentRepository = new MockDepartmentRepository();

