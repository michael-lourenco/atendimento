'use client';

import { useState } from 'react';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { TransferConversationUseCase } from '@/core/usecases/TransferConversationUseCase';
import { departmentNameOf } from '@/core/entities/conversationDepartment';
import { ActionMenu, ActionMenuItem } from '@/ui/components/action-menu';

type TransferAgentControlProps = {
  conversationId: string;
  agents: Agent[];
  currentAgentId?: string;
  departments?: Department[];
  disabled?: boolean;
  onTransferred?: () => void;
};

export function TransferAgentControl({
  conversationId,
  agents,
  currentAgentId,
  departments = [],
  disabled,
  onTransferred,
}: TransferAgentControlProps) {
  const [busy, setBusy] = useState(false);
  const options = agents.filter((agent) => agent.id !== currentAgentId);

  const transfer = async (agent: Agent) => {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await new TransferConversationUseCase().execute({
        conversationId,
        targetAgentId: agent.id,
        targetAgentName: agent.name,
        departmentId: agent.departmentId,
        departmentName: departmentNameOf(departments, agent.departmentId) || undefined,
      });
      onTransferred?.();
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
    } finally {
      setBusy(false);
    }
  };

  if (agents.length === 0) {
    return <span className="text-xs text-muted-foreground">Cadastre um agente</span>;
  }

  if (options.length === 0) {
    return <span className="text-xs text-muted-foreground">Sem outro agente</span>;
  }

  return (
    <ActionMenu label="Transferir" ariaLabel="Transferir conversa" disabled={disabled || busy}>
      {(close) =>
        options.map((agent) => (
          <ActionMenuItem
            key={agent.id}
            onClick={() => {
              void transfer(agent).then(close);
            }}
          >
            {agent.name}
          </ActionMenuItem>
        ))
      }
    </ActionMenu>
  );
}
