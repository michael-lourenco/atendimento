'use client';

import { useState } from 'react';
import { Agent } from '@/core/entities/Agent';
import { TransferConversationUseCase } from '@/core/usecases/TransferConversationUseCase';
import { Button } from '@/ui/components/button';

type TransferAgentControlProps = {
  conversationId: string;
  agents: Agent[];
  onTransferred?: () => void;
};

export function TransferAgentControl({
  conversationId,
  agents,
  onTransferred,
}: TransferAgentControlProps) {
  const [agentId, setAgentId] = useState('');
  const [busy, setBusy] = useState(false);

  const transfer = async () => {
    const agent = agents.find((item) => item.id === agentId);
    if (!agent || busy) {
      return;
    }
    setBusy(true);
    try {
      await new TransferConversationUseCase().execute({
        conversationId,
        targetAgentId: agent.id,
        targetAgentName: agent.name,
      });
      setAgentId('');
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

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={agentId}
        onChange={(event) => setAgentId(event.target.value)}
        aria-label="Agente para transferir"
      >
        <option value="">Agente…</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!agentId || busy}
        onClick={() => void transfer()}
      >
        Transferir
      </Button>
    </div>
  );
}
