import { ScheduledMessage } from '../../core/entities/ScheduledMessage';
import { IScheduledMessageRepository } from '../../core/repositories/IScheduledMessageRepository';
import { createInMemoryCrud } from './inMemoryCrud';

const seed: ScheduledMessage[] = [
  {
    id: '1',
    contact: '5511999999999',
    message: 'Lembrete: Reunião amanhã às 10h',
    scheduledDate: new Date('2099-01-16T10:00:00'),
    status: 'pending',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    contact: '5511888888888',
    message: 'Promoção especial para você!',
    scheduledDate: new Date('2024-01-17T14:00:00'),
    status: 'sent',
    createdAt: new Date('2024-01-14'),
  },
];

export const mockScheduledMessageRepository: IScheduledMessageRepository = createInMemoryCrud(seed);
