'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useRef, useState } from 'react';
import { Message } from '@/core/entities/Message';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { InboxSearchCorpus } from '@/core/entities/inboxFilterHint';

export function useInboxMessageSearch(filter: string, numbers: WhatsAppNumber[]) {
  const [searchMessages, setSearchMessages] = useState<Message[]>([]);
  const filterRef = useRef(filter);
  filterRef.current = filter;

  const loadSearchMessages = async () => {
    if (!filterRef.current.trim()) {
      return;
    }
    try {
      setSearchMessages(await clientUseCases.allMessages().execute());
    } catch {
      // busca por texto fica na prévia lastMessage
    }
  };

  useEffect(() => {
    if (!filter.trim()) {
      setSearchMessages([]);
      return;
    }
    let cancelled = false;
    void clientUseCases.allMessages()
      .execute()
      .then((list) => {
        if (!cancelled) {
          setSearchMessages(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchMessages([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const searchCorpus: InboxSearchCorpus | undefined = filter.trim()
    ? { messages: searchMessages, numbers }
    : undefined;

  return { searchCorpus, loadSearchMessages };
}
