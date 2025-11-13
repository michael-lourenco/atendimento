import { IFlowRepository } from '../../core/repositories/IFlowRepository';
import { IMessageRepository } from '../../core/repositories/IMessageRepository';
import { IAuthRepository } from '../../core/repositories/IAuthRepository';
import { mockFlowRepository } from '../mocks/MockFlowRepository';
import { mockMessageRepository } from '../mocks/MockMessageRepository';
import { mockAuthRepository } from '../mocks/MockAuthRepository';

class ServiceLocator {
  private flowRepository: IFlowRepository;
  private messageRepository: IMessageRepository;
  private authRepository: IAuthRepository;

  constructor() {
    // Inicializa com mocks - pode ser trocado facilmente no futuro
    this.flowRepository = mockFlowRepository;
    this.messageRepository = mockMessageRepository;
    this.authRepository = mockAuthRepository;
  }

  getFlowRepository(): IFlowRepository {
    return this.flowRepository;
  }

  getMessageRepository(): IMessageRepository {
    return this.messageRepository;
  }

  getAuthRepository(): IAuthRepository {
    return this.authRepository;
  }

  // Métodos para trocar implementações (útil quando migrar para backends reais)
  setFlowRepository(repository: IFlowRepository): void {
    this.flowRepository = repository;
  }

  setMessageRepository(repository: IMessageRepository): void {
    this.messageRepository = repository;
  }

  setAuthRepository(repository: IAuthRepository): void {
    this.authRepository = repository;
  }
}

export const serviceLocator = new ServiceLocator();

