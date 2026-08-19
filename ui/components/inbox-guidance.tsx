'use client';

import Link from 'next/link';
import { QUEUE_TAB_LABEL } from '@/core/entities/inboxFilterHint';
import { QueueTab } from '@/core/entities/conversationDepartment';
import { Button } from '@/ui/components/button';

type InboxFilterBannerProps = {
  hiddenCount: number;
  tab: QueueTab;
  onClear: () => void;
};

export function InboxFilterBanner({ hiddenCount, tab, onClear }: InboxFilterBannerProps) {
  if (hiddenCount <= 0) {
    return null;
  }
  const label = QUEUE_TAB_LABEL[tab];
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 text-sm">
      <p className="text-foreground">
        Há {hiddenCount} {hiddenCount === 1 ? 'conversa' : 'conversas'} em {label} fora deste
        filtro.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        Ver todas
      </Button>
    </div>
  );
}

type OperatorAgentBannerProps = {
  email: string;
};

export function OperatorAgentBanner({ email }: OperatorAgentBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
      <p className="text-foreground">
        Seu login ({email}) ainda não está ligado a um atendente. Cadastre o mesmo e-mail em
        Agentes para o setor e o Assumir baterem com você.
      </p>
      <Link href="/dashboard/agents" className="font-medium text-foreground underline">
        Ir para Agentes
      </Link>
    </div>
  );
}
