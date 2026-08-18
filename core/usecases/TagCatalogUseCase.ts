import { Tag } from '../entities/Tag';
import { ITagRepository } from '../repositories/ITagRepository';
import { serviceLocator } from '../../infra/adapters/ServiceLocator';
import { CatalogUseCase } from './CatalogUseCase';

export class TagCatalogUseCase extends CatalogUseCase<Tag> {
  constructor(repo: ITagRepository = serviceLocator.getTagRepository()) {
    super(repo);
  }
}
