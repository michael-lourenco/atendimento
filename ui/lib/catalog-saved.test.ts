import { CATALOG_SAVED_NOTICE_MS, catalogSavedNoticeVisible } from './catalog-saved';

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
