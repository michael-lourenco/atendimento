import { Department } from '../entities/Department';
import { ICrudRepository } from './ICrudRepository';

export type IDepartmentRepository = ICrudRepository<Department>;
