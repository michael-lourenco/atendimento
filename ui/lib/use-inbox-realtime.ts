'use client';

import { useEffect, useRef } from 'react';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { createBrowserSupabase } from '@/infra/supabase/browserClient';
import { createInboxRealtimeHub, InboxRealtimeClient } from '@/ui/lib/inbox-realtime-channel';

let hub: ReturnType<typeof createInboxRealtimeHub> | null = null;

function inboxHub() {
  if (!hub) {
    hub = createInboxRealtimeHub(() => createBrowserSupabase() as InboxRealtimeClient);
  }
  return hub;
}

export function useInboxRealtime(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!isPublicSupabaseConfigured()) {
      return;
    }
    return inboxHub().add(() => onChangeRef.current());
  }, []);
}
