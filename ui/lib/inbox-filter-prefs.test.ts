import {
  inboxFiltersKey,
  parseInboxFilterPrefs,
  serializeInboxFilterPrefs,
  readInboxFilterPrefs,
  writeInboxFilterPrefs,
} from './inbox-filter-prefs';

describe('inbox-filter-prefs', () => {
  it('chave por operador', () => {
    expect(inboxFiltersKey('u1')).toBe('inbox-filters:u1');
  });

  it('roundtrip Minhas, setor e linha', () => {
    const prefs = { mineOnly: false, departmentFilter: 'd1', lineFilter: 'n1' };
    expect(parseInboxFilterPrefs(serializeInboxFilterPrefs(prefs))).toEqual(prefs);
  });

  it('ignora JSON inválido', () => {
    expect(parseInboxFilterPrefs('{')).toBeNull();
    expect(parseInboxFilterPrefs(null)).toBeNull();
  });

  it('lê e grava no store', () => {
    const memory = new Map<string, string>();
    const store = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
    };
    writeInboxFilterPrefs(
      'u1',
      { mineOnly: false, departmentFilter: 'all', lineFilter: 'all' },
      store
    );
    expect(readInboxFilterPrefs('u1', store)?.mineOnly).toBe(false);
  });
});
