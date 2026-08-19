import { Chatbot } from '../../core/entities/Chatbot';
import { IChatbotRepository } from '../../core/repositories/IChatbotRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: Chatbot[] = [
  {
    id: '1',
    name: 'Atendimento Inicial',
    description: 'Roteiro de triagem no WhatsApp (fluxo inicio)',
    isActive: true,
    flowId: 'inicio',
    messagesCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockChatbotRepository: IChatbotRepository = createInMemoryCrud(seed);
