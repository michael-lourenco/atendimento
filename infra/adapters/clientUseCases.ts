import { AgentCatalogUseCase } from '../../core/usecases/AgentCatalogUseCase';
import { AssignConversationUseCase } from '../../core/usecases/AssignConversationUseCase';
import { ChatbotCatalogUseCase } from '../../core/usecases/ChatbotCatalogUseCase';
import { CloseConversationUseCase } from '../../core/usecases/CloseConversationUseCase';
import { ContactCatalogUseCase } from '../../core/usecases/ContactCatalogUseCase';
import { CreateOperatorUseCase } from '../../core/usecases/CreateOperatorUseCase';
import { DeleteFlowUseCase } from '../../core/usecases/DeleteFlowUseCase';
import { DeleteOperatorUseCase } from '../../core/usecases/DeleteOperatorUseCase';
import { DepartmentCatalogUseCase } from '../../core/usecases/DepartmentCatalogUseCase';
import { EnsureOperatorAgentUseCase } from '../../core/usecases/EnsureOperatorAgentUseCase';
import { GenerateReportUseCase } from '../../core/usecases/GenerateReportUseCase';
import { GetAllConversationsUseCase } from '../../core/usecases/GetAllConversationsUseCase';
import { GetAllFlowsUseCase } from '../../core/usecases/GetAllFlowsUseCase';
import { GetAllMessagesUseCase } from '../../core/usecases/GetAllMessagesUseCase';
import { GetConversationByIdUseCase } from '../../core/usecases/GetConversationByIdUseCase';
import { GetCurrentUserUseCase } from '../../core/usecases/GetCurrentUserUseCase';
import { GetDashboardMetricsUseCase } from '../../core/usecases/GetDashboardMetricsUseCase';
import { GetFlowByIdUseCase } from '../../core/usecases/GetFlowByIdUseCase';
import { GetFlowSessionUseCase } from '../../core/usecases/GetFlowSessionUseCase';
import { GetInternalMessagesUseCase } from '../../core/usecases/GetInternalMessagesUseCase';
import { GetMessagesByContactUseCase } from '../../core/usecases/GetMessagesByContactUseCase';
import { ListOperatorsUseCase } from '../../core/usecases/ListOperatorsUseCase';
import { LoginUseCase } from '../../core/usecases/LoginUseCase';
import { LogoutUseCase } from '../../core/usecases/LogoutUseCase';
import { MarkConversationReadUseCase } from '../../core/usecases/MarkConversationReadUseCase';
import { PauseContactFlowUseCase } from '../../core/usecases/PauseContactFlowUseCase';
import { QuickReplyCatalogUseCase } from '../../core/usecases/QuickReplyCatalogUseCase';
import { ReportCatalogUseCase } from '../../core/usecases/ReportCatalogUseCase';
import { ResumeContactFlowUseCase } from '../../core/usecases/ResumeContactFlowUseCase';
import { SaveFlowUseCase } from '../../core/usecases/SaveFlowUseCase';
import { SaveInternalMessageUseCase } from '../../core/usecases/SaveInternalMessageUseCase';
import { ScheduledMessageCatalogUseCase } from '../../core/usecases/ScheduledMessageCatalogUseCase';
import { SetConversationDepartmentUseCase } from '../../core/usecases/SetConversationDepartmentUseCase';
import { SetConversationTagsUseCase } from '../../core/usecases/SetConversationTagsUseCase';
import { SetOperatorPasswordUseCase } from '../../core/usecases/SetOperatorPasswordUseCase';
import { SetOperatorRoleUseCase } from '../../core/usecases/SetOperatorRoleUseCase';
import { SyncLiveWhatsAppNumberUseCase } from '../../core/usecases/SyncLiveWhatsAppNumberUseCase';
import { TagCatalogUseCase } from '../../core/usecases/TagCatalogUseCase';
import { TransferConversationUseCase } from '../../core/usecases/TransferConversationUseCase';
import { UpsertContactFromIncomingUseCase } from '../../core/usecases/UpsertContactFromIncomingUseCase';
import { WhatsAppNumberCatalogUseCase } from '../../core/usecases/WhatsAppNumberCatalogUseCase';
import { serviceLocator } from './ServiceLocator';

export const clientUseCases = {
  tags: () => new TagCatalogUseCase(serviceLocator.getTagRepository()),
  departments: () => new DepartmentCatalogUseCase(serviceLocator.getDepartmentRepository()),
  chatbots: () => new ChatbotCatalogUseCase(serviceLocator.getChatbotRepository()),
  agents: () =>
    new AgentCatalogUseCase(serviceLocator.getAgentRepository(), serviceLocator.getAuthRepository()),
  contacts: () => {
    const contacts = serviceLocator.getContactRepository();
    return new ContactCatalogUseCase(
      contacts,
      serviceLocator.getMessageRepository(),
      new UpsertContactFromIncomingUseCase(contacts)
    );
  },
  quickReplies: () => new QuickReplyCatalogUseCase(serviceLocator.getQuickReplyRepository()),
  scheduledMessages: () =>
    new ScheduledMessageCatalogUseCase(serviceLocator.getScheduledMessageRepository()),
  reports: () => new ReportCatalogUseCase(serviceLocator.getReportRepository()),
  whatsAppNumbers: () =>
    new WhatsAppNumberCatalogUseCase(serviceLocator.getWhatsAppNumberRepository()),

  login: () =>
    new LoginUseCase(serviceLocator.getAuthRepository(), serviceLocator.getAgentRepository()),
  logout: () => new LogoutUseCase(serviceLocator.getAuthRepository()),
  currentUser: () => {
    const auth = serviceLocator.getAuthRepository();
    const agents = serviceLocator.getAgentRepository();
    return new GetCurrentUserUseCase(auth, new EnsureOperatorAgentUseCase(agents), agents);
  },
  listOperators: () => new ListOperatorsUseCase(serviceLocator.getAuthRepository()),
  createOperator: () => {
    const auth = serviceLocator.getAuthRepository();
    const agents = serviceLocator.getAgentRepository();
    return new CreateOperatorUseCase(auth, agents, new EnsureOperatorAgentUseCase(agents));
  },
  setOperatorRole: () => new SetOperatorRoleUseCase(serviceLocator.getAuthRepository()),
  setOperatorPassword: () => new SetOperatorPasswordUseCase(serviceLocator.getAuthRepository()),
  deleteOperator: () =>
    new DeleteOperatorUseCase(serviceLocator.getAuthRepository(), serviceLocator.getAgentRepository()),

  allFlows: () => new GetAllFlowsUseCase(serviceLocator.getFlowRepository()),
  flowById: () => new GetFlowByIdUseCase(serviceLocator.getFlowRepository()),
  saveFlow: () => new SaveFlowUseCase(serviceLocator.getFlowRepository()),
  deleteFlow: () =>
    new DeleteFlowUseCase(
      serviceLocator.getFlowRepository(),
      serviceLocator.getFlowSessionRepository(),
      serviceLocator.getChatbotRepository()
    ),

  conversations: () =>
    new GetAllConversationsUseCase(
      serviceLocator.getConversationRepository(),
      serviceLocator.getMessageRepository(),
      serviceLocator.getWhatsAppNumberRepository()
    ),
  conversationById: () =>
    new GetConversationByIdUseCase(serviceLocator.getConversationRepository()),
  allMessages: () => new GetAllMessagesUseCase(serviceLocator.getMessageRepository()),
  messagesByContact: () => new GetMessagesByContactUseCase(serviceLocator.getMessageRepository()),
  flowSession: () => new GetFlowSessionUseCase(serviceLocator.getFlowSessionRepository()),
  markConversationRead: () =>
    new MarkConversationReadUseCase(serviceLocator.getConversationRepository()),
  assignConversation: () => new AssignConversationUseCase(serviceLocator.getConversationRepository()),
  closeConversation: () => new CloseConversationUseCase(serviceLocator.getConversationRepository()),
  transferConversation: () =>
    new TransferConversationUseCase(serviceLocator.getConversationRepository()),
  pauseContactFlow: () =>
    new PauseContactFlowUseCase(
      serviceLocator.getFlowSessionRepository(),
      serviceLocator.getFlowRepository(),
      serviceLocator.getChatbotRepository()
    ),
  resumeContactFlow: () => new ResumeContactFlowUseCase(serviceLocator.getFlowSessionRepository()),
  setConversationDepartment: () =>
    new SetConversationDepartmentUseCase(serviceLocator.getConversationRepository()),
  setConversationTags: () =>
    new SetConversationTagsUseCase(serviceLocator.getConversationRepository()),
  internalMessages: () =>
    new GetInternalMessagesUseCase(serviceLocator.getInternalMessageRepository()),
  saveInternalMessage: () =>
    new SaveInternalMessageUseCase(serviceLocator.getInternalMessageRepository()),
  dashboardMetrics: () =>
    new GetDashboardMetricsUseCase(
      serviceLocator.getMessageRepository(),
      serviceLocator.getConversationRepository(),
      serviceLocator.getWhatsAppNumberRepository()
    ),
  generateReport: () => new GenerateReportUseCase(serviceLocator.getReportRepository()),
  upsertContactFromIncoming: () =>
    new UpsertContactFromIncomingUseCase(serviceLocator.getContactRepository()),
  syncLiveWhatsAppNumber: () =>
    new SyncLiveWhatsAppNumberUseCase(serviceLocator.getWhatsAppNumberRepository()),
};
