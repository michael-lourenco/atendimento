import { IFlowRepository } from '../../core/repositories/IFlowRepository';
import { IMessageRepository } from '../../core/repositories/IMessageRepository';
import { IAuthRepository } from '../../core/repositories/IAuthRepository';
import { IWhatsAppService } from '../../core/services/IWhatsAppService';
import { mockFlowRepository } from '../mocks/MockFlowRepository';
import { mockMessageRepository } from '../mocks/MockMessageRepository';
import { mockAuthRepository } from '../mocks/MockAuthRepository';
import { WhatsAppService } from '../whatsapp/WhatsAppService';
import { TwilioWhatsAppService } from '../whatsapp/TwilioWhatsAppService';
import { EvolutionWhatsAppService } from '../whatsapp/EvolutionWhatsAppService';

class ServiceLocator {
  private flowRepository: IFlowRepository;
  private messageRepository: IMessageRepository;
  private authRepository: IAuthRepository;
  private whatsAppService: IWhatsAppService;

  constructor() {
    // Inicializa com mocks - pode ser trocado facilmente no futuro
    this.flowRepository = mockFlowRepository;
    this.messageRepository = mockMessageRepository;
    this.authRepository = mockAuthRepository;
    
    // Inicializa serviço WhatsApp baseado na variável de ambiente
    // Opções: 'meta' (padrão), 'twilio', ou outros serviços intermediários
    this.whatsAppService = this.createWhatsAppService();
  }

  /**
   * Cria a instância do serviço WhatsApp baseado na variável de ambiente WHATSAPP_PROVIDER
   * 
   * Variáveis de ambiente suportadas:
   * - WHATSAPP_PROVIDER=meta (padrão) -> Usa Meta Cloud API diretamente
   * - WHATSAPP_PROVIDER=twilio -> Usa Twilio como intermediário
   * - WHATSAPP_PROVIDER=evolution -> Usa Evolution API como intermediário
   * 
   * Para adicionar novos provedores:
   * 1. Crie uma nova classe que implementa IWhatsAppService
   * 2. Adicione o import aqui
   * 3. Adicione um case no switch abaixo
   */
  private createWhatsAppService(): IWhatsAppService {
    const provider = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();

    switch (provider) {
      case 'twilio':
        console.log('📱 Usando Twilio como serviço intermediário WhatsApp');
        return new TwilioWhatsAppService();
      
      case 'evolution':
        console.log('📱 Usando Evolution API como serviço intermediário WhatsApp');
        return new EvolutionWhatsAppService();
      
      case 'meta':
      default:
        console.log('📱 Usando Meta Cloud API diretamente');
        return new WhatsAppService();
    }
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

  getWhatsAppService(): IWhatsAppService {
    return this.whatsAppService;
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

  setWhatsAppService(service: IWhatsAppService): void {
    this.whatsAppService = service;
  }
}

export const serviceLocator = new ServiceLocator();

