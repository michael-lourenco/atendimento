import { Flow } from '../entities/Flow';

export interface IFlowRepository {
  getAll(): Promise<Flow[]>;
  getById(id: string): Promise<Flow | null>;
  save(flow: Flow): Promise<void>;
  delete(id: string): Promise<void>;
  update(flow: Flow): Promise<void>;
}

