'use client';

import { RefObject, useEffect } from 'react';
import { Conversation } from '@/core/entities/Conversation';
import { inboxDocumentTitle, inboxUnreadTotal } from '@/ui/lib/inbox-notify';
import { inboxListKeyAction } from '@/ui/lib/inbox-keyboard';
import { isTypingTarget } from '@/ui/lib/use-catalog-search-shortcut';

export function useInboxDocumentTitle(conversations: Conversation[]) {
  useEffect(() => {
    const previous = document.title;
    document.title = inboxDocumentTitle(inboxUnreadTotal(conversations));
    return () => {
      document.title = previous;
    };
  }, [conversations]);
}

export function useInboxShortcuts(input: {
  searchRef: RefObject<HTMLInputElement | null>;
  threadOpen: boolean;
  helpOpen?: boolean;
  focusedIndex: number;
  listLength: number;
  onBack: () => void;
  onFocusIndex: (index: number) => void;
  onOpenIndex: (index: number) => void;
  onToggleHelp?: () => void;
  onCloseHelp?: () => void;
}) {
  const {
    searchRef,
    threadOpen,
    helpOpen = false,
    focusedIndex,
    listLength,
    onBack,
    onFocusIndex,
    onOpenIndex,
    onToggleHelp,
    onCloseHelp,
  } = input;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = inboxListKeyAction({
        key: event.key,
        typing: isTypingTarget(event.target),
        modified: event.ctrlKey || event.metaKey || event.altKey,
        helpOpen,
        threadOpen,
        focusedIndex,
        listLength,
      });
      if (!action) {
        return;
      }
      event.preventDefault();
      if (action.type === 'toggle-help') {
        onToggleHelp?.();
        return;
      }
      if (action.type === 'close-help') {
        onCloseHelp?.();
        return;
      }
      if (action.type === 'focus-search') {
        searchRef.current?.focus();
        return;
      }
      if (action.type === 'back') {
        onBack();
        return;
      }
      if (action.type === 'move') {
        onFocusIndex(action.index);
        return;
      }
      onOpenIndex(action.index);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    focusedIndex,
    helpOpen,
    listLength,
    onBack,
    onCloseHelp,
    onFocusIndex,
    onOpenIndex,
    onToggleHelp,
    searchRef,
    threadOpen,
  ]);
}
