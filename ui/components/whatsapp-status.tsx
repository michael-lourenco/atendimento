'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/ui/lib/utils';
import { useWhatsAppStatus } from '@/ui/lib/use-whatsapp-status';

export function WhatsAppStatusChip() {
  const { connected, pushname } = useWhatsAppStatus();
  if (connected === null) {
    return null;
  }

  return (
    <Link
      href="/dashboard/whatsapp"
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-2 py-1 text-xs sm:inline-flex',
        connected
          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
          : 'border-destructive/40 bg-destructive/10 text-destructive'
      )}
      title={pushname ? `Conectado como ${pushname}` : 'Status do WhatsApp'}
    >
      {connected ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <XCircle className="h-3.5 w-3.5" />
      )}
      <span>{connected ? 'WhatsApp conectado' : 'WhatsApp desconectado'}</span>
    </Link>
  );
}

export function WhatsAppDisconnectedBanner() {
  const { connected } = useWhatsAppStatus();
  if (connected !== false) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
      <p className="text-foreground">WhatsApp desconectado. Escaneie o QR para receber conversas.</p>
      <Link href="/dashboard/whatsapp" className="font-medium text-foreground underline">
        Conectar
      </Link>
    </div>
  );
}
