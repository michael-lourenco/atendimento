export type InboxListKeyAction =
  | { type: 'focus-search' }
  | { type: 'back' }
  | { type: 'move'; index: number }
  | { type: 'open'; index: number };

export function nextInboxFocusIndex(current: number, delta: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (current + delta + length * 8) % length;
}

export function inboxListKeyAction(input: {
  key: string;
  typing: boolean;
  modified?: boolean;
  threadOpen: boolean;
  focusedIndex: number;
  listLength: number;
}): InboxListKeyAction | null {
  const key = input.key.length === 1 ? input.key.toLowerCase() : input.key;
  if (key === '/' && !input.typing && !input.modified) {
    return { type: 'focus-search' };
  }
  if (key === 'Escape' && input.threadOpen && !input.typing) {
    return { type: 'back' };
  }
  if (input.typing || input.modified || input.listLength === 0) {
    return null;
  }
  if (key === 'j' || key === 'ArrowDown') {
    return { type: 'move', index: nextInboxFocusIndex(input.focusedIndex, 1, input.listLength) };
  }
  if (key === 'k' || key === 'ArrowUp') {
    return { type: 'move', index: nextInboxFocusIndex(input.focusedIndex, -1, input.listLength) };
  }
  if (key === 'Enter') {
    return { type: 'open', index: input.focusedIndex };
  }
  return null;
}
