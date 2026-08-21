'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { companyChatbotFlowId } from '@/core/entities/chatbotActive';
import { isAdmin } from '@/core/entities/operatorRole';
import { User } from '@/core/entities/User';
import { DashboardSetupChecklist } from '@/ui/components/dashboard-setup-checklist';
import { dashboardSetupChecks, dashboardSetupPending, DashboardSetupCheck } from '@/ui/lib/dashboard-setup';
import { useWhatsAppStatus } from '@/ui/lib/use-whatsapp-status';
import { useEffect, useState } from 'react';

type InboxSetupChecklistProps = {
  operator: User | null;
};

export function InboxSetupChecklist({ operator }: InboxSetupChecklistProps) {
  const { connected } = useWhatsAppStatus();
  const [pending, setPending] = useState<DashboardSetupCheck[] | null>(null);

  useEffect(() => {
    if (!operator || !isAdmin(operator)) {
      setPending([]);
      return;
    }
    void (async () => {
      try {
        const [bots, flows] = await Promise.all([
          clientUseCases.chatbots().list(),
          clientUseCases.allFlows().execute(),
        ]);
        setPending(
          dashboardSetupPending(
            dashboardSetupChecks({
              lineConnected: connected === true,
              hasEntryFlow: Boolean(companyChatbotFlowId(bots)),
              hasFlow: flows.length > 0,
            })
          )
        );
      } catch {
        setPending([]);
      }
    })();
  }, [connected, operator]);

  if (!operator || !isAdmin(operator) || pending == null) {
    return null;
  }
  return <DashboardSetupChecklist pending={pending} />;
}
