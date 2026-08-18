import { Contact } from '../entities/Contact';
import { ICrudRepository } from './ICrudRepository';

export type IContactRepository = ICrudRepository<Contact>;
