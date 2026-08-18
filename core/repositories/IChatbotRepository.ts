import { Chatbot } from '../entities/Chatbot';
import { ICrudRepository } from './ICrudRepository';

export type IChatbotRepository = ICrudRepository<Chatbot>;
