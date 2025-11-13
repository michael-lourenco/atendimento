import { IFlowRepository } from '../../core/repositories/IFlowRepository';
import { Flow, FlowStep } from '../../core/entities/Flow';

export class MockFlowRepository implements IFlowRepository {
  private flows: Flow[] = [
    {
      id: 'inicio',
      name: 'Atendimento Inicial',
      description: 'Fluxo de boas-vindas e triagem inicial',
      isActive: true,
      steps: [
        {
          id: 'step1',
          type: 'message',
          content: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
          nextStepId: 'step2',
        },
        {
          id: 'step2',
          type: 'question',
          content: 'Selecione uma opção:',
          options: ['Suporte técnico', 'Vendas', 'Financeiro', 'Outros'],
          nextStepId: 'step3',
        },
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'suporte',
      name: 'Fluxo de Suporte',
      description: 'Atendimento para questões técnicas',
      isActive: true,
      steps: [
        {
          id: 'step1',
          type: 'message',
          content: 'Você está no canal de suporte técnico. Descreva seu problema:',
          nextStepId: 'step2',
        },
      ],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  async getAll(): Promise<Flow[]> {
    return Promise.resolve(this.flows);
  }

  async getById(id: string): Promise<Flow | null> {
    const flow = this.flows.find(f => f.id === id);
    return Promise.resolve(flow || null);
  }

  async save(flow: Flow): Promise<void> {
    const existingIndex = this.flows.findIndex(f => f.id === flow.id);
    if (existingIndex >= 0) {
      this.flows[existingIndex] = { ...flow, updatedAt: new Date() };
    } else {
      this.flows.push({
        ...flow,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return Promise.resolve();
  }

  async update(flow: Flow): Promise<void> {
    return this.save(flow);
  }

  async delete(id: string): Promise<void> {
    this.flows = this.flows.filter(f => f.id !== id);
    return Promise.resolve();
  }
}

export const mockFlowRepository = new MockFlowRepository();

