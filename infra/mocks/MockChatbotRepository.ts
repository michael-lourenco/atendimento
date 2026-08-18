import { Chatbot } from '../../core/entities/Chatbot';
import { IChatbotRepository } from '../../core/repositories/IChatbotRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Chatbot[] = [
  {
    id: '1',
    name: 'Atendimento Inicial',
    description: 'Chatbot para triagem inicial',
    isActive: true,
    flowId: 'inicio',
    messagesCount: 150,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Suporte Técnico',
    description: 'Chatbot para questões técnicas',
    isActive: true,
    flowId: 'suporte',
    messagesCount: 89,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

export const mockChatbotRepository: IChatbotRepository = createInMemoryCrud(seed);
