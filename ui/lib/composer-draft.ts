export const COMPOSER_DRAFT_MAX_CHARS = 8000;

export type ComposerDraftStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function composerDraftKey(conversationId: string): string {
  return `composer-draft:${conversationId.trim()}`;
}

export function readComposerDraft(
  conversationId: string,
  store: ComposerDraftStore | null = browserComposerDraftStore()
): string {
  const id = conversationId.trim();
  if (!id || !store) {
    return '';
  }
  return store.getItem(composerDraftKey(id)) ?? '';
}

export function writeComposerDraft(
  conversationId: string,
  text: string,
  store: ComposerDraftStore | null = browserComposerDraftStore()
): void {
  const id = conversationId.trim();
  if (!id || !store) {
    return;
  }
  if (!text) {
    store.removeItem(composerDraftKey(id));
    return;
  }
  store.setItem(composerDraftKey(id), text.slice(0, COMPOSER_DRAFT_MAX_CHARS));
}

export function browserComposerDraftStore(): ComposerDraftStore | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    return sessionStorage;
  } catch {
    return null;
  }
}
