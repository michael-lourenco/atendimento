import { catalogPersistErrorMessage } from './catalog-persist-error';

describe('catalogPersistErrorMessage', () => {
  it('explica tabela ausente no PostgREST', () => {
    expect(catalogPersistErrorMessage({ code: 'PGRST205' }, 'quick_replies')).toContain(
      'quick_replies'
    );
  });

  it('usa a mensagem do Error', () => {
    expect(catalogPersistErrorMessage(new Error('falhou'), 'tags')).toBe('falhou');
  });

  it('explica FK de sessões ao excluir fluxo', () => {
    expect(catalogPersistErrorMessage({ code: '23503' }, 'flows')).toContain('015_flow_delete_cascade');
  });
});
