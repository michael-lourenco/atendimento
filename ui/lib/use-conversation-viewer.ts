'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { useEffect } from 'react';

export function useConversationViewer(
  conversationId: string | undefined,
  agentId: string | undefined,
  agentName: string | undefined
) {
  useEffect(() => {
    const id = conversationId?.trim();
    const viewerId = agentId?.trim();
    const viewerName = agentName?.trim();
    if (!id || !viewerId || !viewerName) {
      return;
    }
    const touch = (present: boolean) => {
      void clientUseCases
        .touchConversationViewer()
        .execute({ conversationId: id, agentId: viewerId, agentName: viewerName, present })
        .catch(() => undefined);
    };
    touch(true);
    const timer = setInterval(() => touch(true), DASHBOARD_POLL_MS);
    return () => {
      clearInterval(timer);
      touch(false);
    };
  }, [conversationId, agentId, agentName]);
}
