import { matchFlowByKeyword } from './matchFlowByKeyword';
import { Flow } from '../entities/Flow';

const now = new Date(0);
const make = (id: string, keywords: string[], active = true): Flow => ({
  id,
  name: id,
  isActive: active,
  keywords,
  steps: [],
  createdAt: now,
  updatedAt: now,
});

describe('matchFlowByKeyword', () => {
  it('escolhe o fluxo ativo com a palavra mais longa', () => {
    const flows = [make('a', ['pre']), make('b', ['preço'])];
    expect(matchFlowByKeyword(flows, 'quero o preço', 'inicio')?.id).toBe('b');
  });

  it('ignora o fluxo atual e os inativos', () => {
    const flows = [make('preco', ['preço']), make('outro', ['preço'], false)];
    expect(matchFlowByKeyword(flows, 'preço', 'preco')).toBeNull();
  });
});
