import {
  CATALOG_SAVED_NOTICE_MS,
  catalogActionButtonLabel,
  catalogSavedNoticeVisible,
} from './catalog-saved';

describe('catalogSavedNoticeVisible', () => {
  it('mostra o aviso dentro do TTL', () => {
    expect(catalogSavedNoticeVisible(1000, 1000 + CATALOG_SAVED_NOTICE_MS - 1)).toBe(true);
  });

  it('esconde o aviso depois do TTL', () => {
    expect(catalogSavedNoticeVisible(1000, 1000 + CATALOG_SAVED_NOTICE_MS)).toBe(false);
  });

  it('esconde se ainda não salvou', () => {
    expect(catalogSavedNoticeVisible(null, 5000)).toBe(false);
  });
});

describe('catalogActionButtonLabel', () => {
  const idle = { saving: false, show: false, kind: 'success' as const };

  it('mostra Salvando… enquanto grava', () => {
    expect(catalogActionButtonLabel('Salvar', { ...idle, saving: true })).toBe('Salvando…');
  });

  it('mostra Salvo depois do sucesso', () => {
    expect(catalogActionButtonLabel('Salvar', { saving: false, show: true, kind: 'success' })).toBe(
      'Salvo'
    );
  });

  it('só troca Publicar quando a mensagem é Publicado', () => {
    expect(
      catalogActionButtonLabel(
        'Publicar',
        { saving: false, show: true, kind: 'success', message: 'Salvo' },
        'Publicado'
      )
    ).toBe('Publicar');
    expect(
      catalogActionButtonLabel(
        'Publicar',
        { saving: false, show: true, kind: 'success', message: 'Publicado' },
        'Publicado'
      )
    ).toBe('Publicado');
  });

  it('erro não troca o rótulo', () => {
    expect(catalogActionButtonLabel('Salvar', { saving: false, show: true, kind: 'error' })).toBe(
      'Salvar'
    );
  });
});
