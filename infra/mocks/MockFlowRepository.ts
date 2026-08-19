import { IFlowRepository } from '../../core/repositories/IFlowRepository';
import { Flow } from '../../core/entities/Flow';
import { salesIntakeFlows } from '../../core/entities/atendimentoInicialFlow';

const seeded = salesIntakeFlows(new Date('2024-01-01'));

export class MockFlowRepository implements IFlowRepository {
  private flows: Flow[] = [
    ...seeded,
    {
      id: 'suporte',
      name: 'Fluxo de Suporte',
      description: 'Exemplo inativo — o WhatsApp usa só o Atendimento Inicial',
      isActive: false,
      steps: [
        {
          id: 'step1',
          type: 'message',
          content: 'Você está no canal de suporte. Descreva seu problema:',
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
    const flow = this.flows.find((item) => item.id === id);
    return Promise.resolve(flow || null);
  }

  async save(flow: Flow): Promise<void> {
    const existingIndex = this.flows.findIndex((item) => item.id === flow.id);
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
    this.flows = this.flows.filter((item) => item.id !== id);
    return Promise.resolve();
  }
}

export const mockFlowRepository = new MockFlowRepository();
