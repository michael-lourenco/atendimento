import { readComposerDraft, writeComposerDraft, COMPOSER_DRAFT_MAX_CHARS } from './composer-draft';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };
}

describe('composer draft', () => {
  it('grava e lê por conversa', () => {
    const store = memoryStore();
    writeComposerDraft('c1', 'Olá', store);
    expect(readComposerDraft('c1', store)).toBe('Olá');
    expect(readComposerDraft('c2', store)).toBe('');
  });

  it('vazio remove o rascunho', () => {
    const store = memoryStore();
    writeComposerDraft('c1', 'Olá', store);
    writeComposerDraft('c1', '', store);
    expect(readComposerDraft('c1', store)).toBe('');
  });

  it('corta no teto de 8000 caracteres', () => {
    const store = memoryStore();
    writeComposerDraft('c1', 'a'.repeat(COMPOSER_DRAFT_MAX_CHARS + 20), store);
    expect(readComposerDraft('c1', store).length).toBe(COMPOSER_DRAFT_MAX_CHARS);
  });

  it('id vazio não grava', () => {
    const store = memoryStore();
    writeComposerDraft('  ', 'Olá', store);
    expect(readComposerDraft('  ', store)).toBe('');
  });
});
