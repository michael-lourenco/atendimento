import { useEffect, useRef, useState } from 'react';
import { readComposerDraft, writeComposerDraft } from '@/ui/lib/composer-draft';

export function useComposerDraft(conversationId?: string) {
  const idRef = useRef(conversationId);
  const [draft, setDraftState] = useState(() => readComposerDraft(conversationId ?? ''));

  useEffect(() => {
    idRef.current = conversationId;
    setDraftState(readComposerDraft(conversationId ?? ''));
  }, [conversationId]);

  const setDraft = (value: string) => {
    setDraftState(value);
    writeComposerDraft(idRef.current ?? '', value);
  };

  return { draft, setDraft };
}
