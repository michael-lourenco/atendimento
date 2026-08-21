import { inboxListKeyAction, nextInboxFocusIndex } from './inbox-keyboard';

describe('inboxListKeyAction', () => {
  const base = {
    typing: false,
    threadOpen: false,
    focusedIndex: 1,
    listLength: 3,
  };

  it('j/k e setas movem o destaque (circular)', () => {
    expect(inboxListKeyAction({ ...base, key: 'j' })).toEqual({ type: 'move', index: 2 });
    expect(inboxListKeyAction({ ...base, key: 'ArrowDown' })).toEqual({ type: 'move', index: 2 });
    expect(inboxListKeyAction({ ...base, key: 'k' })).toEqual({ type: 'move', index: 0 });
    expect(inboxListKeyAction({ ...base, key: 'ArrowUp' })).toEqual({ type: 'move', index: 0 });
    expect(nextInboxFocusIndex(0, -1, 3)).toBe(2);
  });

  it('Enter abre; Esc volta se a thread estiver aberta', () => {
    expect(inboxListKeyAction({ ...base, key: 'Enter' })).toEqual({ type: 'open', index: 1 });
    expect(inboxListKeyAction({ ...base, key: 'Escape', threadOpen: true })).toEqual({
      type: 'back',
    });
    expect(inboxListKeyAction({ ...base, key: 'Escape', threadOpen: false })).toBeNull();
  });

  it('não dispara ao digitar', () => {
    expect(inboxListKeyAction({ ...base, key: 'j', typing: true })).toBeNull();
    expect(inboxListKeyAction({ ...base, key: 'Enter', typing: true })).toBeNull();
    expect(inboxListKeyAction({ ...base, key: 'j', modified: true })).toBeNull();
    expect(inboxListKeyAction({ ...base, key: 'J' })).toEqual({ type: 'move', index: 2 });
  });

  it('? abre a folha; Esc fecha a folha antes da lista', () => {
    expect(inboxListKeyAction({ ...base, key: '?' })).toEqual({ type: 'toggle-help' });
    expect(inboxListKeyAction({ ...base, key: 'Escape', helpOpen: true, threadOpen: true })).toEqual({
      type: 'close-help',
    });
    expect(inboxListKeyAction({ ...base, key: 'j', helpOpen: true })).toBeNull();
  });
});
