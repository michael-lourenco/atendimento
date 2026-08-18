import { IFlowRepository } from '../../core/repositories/IFlowRepository';
import { IMessageRepository } from '../../core/repositories/IMessageRepository';
import { IAuthRepository } from '../../core/repositories/IAuthRepository';
import { IFlowSessionRepository } from '../../core/repositories/IFlowSessionRepository';
import { IConversationRepository } from '../../core/repositories/IConversationRepository';
import { IDepartmentRepository } from '../../core/repositories/IDepartmentRepository';
import { IInternalMessageRepository } from '../../core/repositories/IInternalMessageRepository';
import { IChatbotRepository } from '../../core/repositories/IChatbotRepository';
import { IAgentRepository } from '../../core/repositories/IAgentRepository';
import { IContactRepository } from '../../core/repositories/IContactRepository';
import { IWhatsAppNumberRepository } from '../../core/repositories/IWhatsAppNumberRepository';
import { ITagRepository } from '../../core/repositories/ITagRepository';
import { IScheduledMessageRepository } from '../../core/repositories/IScheduledMessageRepository';
import { IReportRepository } from '../../core/repositories/IReportRepository';
import { mockFlowRepository } from '../mocks/MockFlowRepository';
import { mockMessageRepository } from '../mocks/MockMessageRepository';
import { mockAuthRepository } from '../mocks/MockAuthRepository';
import { mockFlowSessionRepository } from '../mocks/MockFlowSessionRepository';
import { mockConversationRepository } from '../mocks/MockConversationRepository';
import { mockDepartmentRepository } from '../mocks/MockDepartmentRepository';
import { mockInternalMessageRepository } from '../mocks/MockInternalMessageRepository';
import { mockChatbotRepository } from '../mocks/MockChatbotRepository';
import { mockAgentRepository } from '../mocks/MockAgentRepository';
import { mockContactRepository } from '../mocks/MockContactRepository';
import { mockWhatsAppNumberRepository } from '../mocks/MockWhatsAppNumberRepository';
import { mockTagRepository } from '../mocks/MockTagRepository';
import { mockScheduledMessageRepository } from '../mocks/MockScheduledMessageRepository';
import { mockReportRepository } from '../mocks/MockReportRepository';

export interface RepositoryBag {
  flow: IFlowRepository;
  message: IMessageRepository;
  auth: IAuthRepository;
  flowSession: IFlowSessionRepository;
  conversation: IConversationRepository;
  department: IDepartmentRepository;
  internalMessage: IInternalMessageRepository;
  chatbot: IChatbotRepository;
  agent: IAgentRepository;
  contact: IContactRepository;
  whatsAppNumber: IWhatsAppNumberRepository;
  tag: ITagRepository;
  scheduledMessage: IScheduledMessageRepository;
  report: IReportRepository;
}

export function createMockRepositoryBag(): RepositoryBag {
  return {
    flow: mockFlowRepository,
    message: mockMessageRepository,
    auth: mockAuthRepository,
    flowSession: mockFlowSessionRepository,
    conversation: mockConversationRepository,
    department: mockDepartmentRepository,
    internalMessage: mockInternalMessageRepository,
    chatbot: mockChatbotRepository,
    agent: mockAgentRepository,
    contact: mockContactRepository,
    whatsAppNumber: mockWhatsAppNumberRepository,
    tag: mockTagRepository,
    scheduledMessage: mockScheduledMessageRepository,
    report: mockReportRepository,
  };
}
