'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { connectedCatalogCount } from '@/ui/lib/whatsapp-chip';

export type WhatsAppInstanceStatus = {
  name: string;
  connected: boolean;
};

export type WhatsAppStatusValue = {
  connected: boolean | null;
  pushname: string | null;
  wid: string | null;
  platform: string | null;
  instances: WhatsAppInstanceStatus[];
  catalogCount: number;
  connectedCount: number;
};

const WhatsAppStatusContext = createContext<WhatsAppStatusValue | null>(null);

function useWhatsAppStatusSource(pollMs = DASHBOARD_POLL_MS): WhatsAppStatusValue {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [pushname, setPushname] = useState<string | null>(null);
  const [wid, setWid] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);
  const [instances, setInstances] = useState<WhatsAppInstanceStatus[]>([]);
  const [catalogCount, setCatalogCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const load = async () => {
      if (inFlight) {
        return;
      }
      inFlight = true;
      try {
        const [response, numbers] = await Promise.all([
          fetch('/api/chat-whatsapp/status'),
          listWhatsAppNumbersCached(),
        ]);
        if (!response.ok) {
          throw new Error('status');
        }
        const data = await response.json();
        if (cancelled) {
          return;
        }
        const listed: WhatsAppInstanceStatus[] = Array.isArray(data.instances)
          ? data.instances.map((item: { name?: string; connected?: boolean }) => ({
              name: String(item.name || ''),
              connected: Boolean(item.connected),
            }))
          : [];
        const names = numbers.map((item) => item.instanceName);
        const catalog = numbers.filter((item) => item.instanceName).length;
        setConnected(Boolean(data.connected));
        setPushname(data.info?.pushname ?? null);
        setWid(data.info?.wid ?? null);
        setPlatform(data.info?.platform ?? null);
        setInstances(listed);
        setCatalogCount(catalog);
        setConnectedCount(
          catalog > 0
            ? connectedCatalogCount(names, listed)
            : data.connected
              ? 1
              : 0
        );
      } catch {
        if (!cancelled) {
          setConnected(false);
          setPushname(null);
          setWid(null);
          setPlatform(null);
          setInstances([]);
          setCatalogCount(0);
          setConnectedCount(0);
        }
      } finally {
        inFlight = false;
      }
    };
    void load();
    const timer = setInterval(() => void load(), pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  return {
    connected,
    pushname,
    wid,
    platform,
    instances,
    catalogCount,
    connectedCount,
  };
}

export function WhatsAppStatusProvider({ children }: { children: ReactNode }) {
  const value = useWhatsAppStatusSource();
  return (
    <WhatsAppStatusContext.Provider value={value}>{children}</WhatsAppStatusContext.Provider>
  );
}

export function useWhatsAppStatus(): WhatsAppStatusValue {
  const value = useContext(WhatsAppStatusContext);
  if (!value) {
    throw new Error('useWhatsAppStatus precisa do WhatsAppStatusProvider');
  }
  return value;
}
