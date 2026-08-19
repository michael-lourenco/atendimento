'use client';

import { useEffect, useState } from 'react';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';

export function useWhatsAppStatus(pollMs = DASHBOARD_POLL_MS) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [pushname, setPushname] = useState<string | null>(null);
  const [wid, setWid] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('/api/chat-whatsapp/status');
        if (!response.ok) {
          throw new Error('status');
        }
        const data = await response.json();
        if (!cancelled) {
          setConnected(Boolean(data.connected));
          setPushname(data.info?.pushname ?? null);
          setWid(data.info?.wid ?? null);
          setPlatform(data.info?.platform ?? null);
        }
      } catch {
        if (!cancelled) {
          setConnected(false);
          setPushname(null);
          setWid(null);
          setPlatform(null);
        }
      }
    };
    void load();
    const timer = setInterval(() => void load(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  return { connected, pushname, wid, platform };
}
