import { ScheduledMessage } from '../entities/ScheduledMessage';
import { ICrudRepository } from './ICrudRepository';

export type IScheduledMessageRepository = ICrudRepository<ScheduledMessage>;
