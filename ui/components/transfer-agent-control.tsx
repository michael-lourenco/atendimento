'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useState } from 'react';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { departmentNameOf } from '@/core/entities/conversationDepartment';
import { ActionMenu, ActionMenuItem } from '@/ui/components/action-menu';

type TransferAgentControlProps = {
  conversationId: string;
  agents: Agent[];
  currentAgentId?: string;
  departments?: Department[];
  disabled?: boolean;
  asItems?: boolean;
  onClose?: () => void;
  onTransferred?: (agentName: string) => void;
  onError?: (message: string) => void;
};

export function TransferAgentControl({
  conversationId,
  agents,
  currentAgentId,
  departments = [],
  disabled,
  asItems,
  onClose,
  onTransferred,
  onError,
}: TransferAgentControlProps) {
  const [busy, setBusy] = useState(false);
  const options = agents.filter((agent) => agent.id !== currentAgentId);

  const transfer = async (agent: Agent) => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await clientUseCases.transferConversation().execute({
        conversationId,
        targetAgentId: agent.id,
        targetAgentName: agent.name,
        departmentId: agent.departmentId,
        departmentName: departmentNameOf(departments, agent.departmentId) || undefined,
      });
      onTransferred?.(agent.name);
    } catch {
      onError?.('Não foi possível transferir.');
    } finally {
      setBusy(false);
    }
  };

  const items = (close: () => void) =>
    options.map((agent) => (
      <ActionMenuItem
        key={agent.id}
        disabled={disabled || busy}
        onClick={() => {
          void transfer(agent).then(close);
        }}
      >
        {agent.name}
      </ActionMenuItem>
    ));

  if (agents.length === 0) {
    return <span className="px-2 py-1.5 text-xs text-muted-foreground">Cadastre um agente</span>;
  }

  if (options.length === 0) {
    return <span className="px-2 py-1.5 text-xs text-muted-foreground">Sem outro agente</span>;
  }

  if (asItems) {
    return <>{items(onClose ?? (() => undefined))}</>;
  }

  return (
    <ActionMenu label="Transferir" ariaLabel="Transferir conversa" disabled={disabled || busy}>
      {(close) => items(close)}
    </ActionMenu>
  );
}
