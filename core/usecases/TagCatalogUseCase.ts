import { Tag } from '../entities/Tag';
import { ITagRepository } from '../repositories/ITagRepository';
import { CatalogUseCase } from './CatalogUseCase';

export class TagCatalogUseCase extends CatalogUseCase<Tag> {
  constructor(repo: ITagRepository) {
    super(repo);
  }
}
