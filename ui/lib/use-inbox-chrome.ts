'use client';

import { RefObject, useEffect } from 'react';
import { Conversation } from '@/core/entities/Conversation';
import { inboxDocumentTitle, inboxUnreadTotal } from '@/ui/lib/inbox-notify';

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
  searchRef: RefObject<HTMLInputElement>;
  selectedPhone: string;
  onBack: () => void;
}) {
  const { searchRef, selectedPhone, onBack } = input;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (
        event.key === 'Escape' &&
        selectedPhone &&
        window.matchMedia('(max-width: 1023px)').matches
      ) {
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onBack, searchRef, selectedPhone]);
}
