'use client';

import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { User } from '@/core/entities/User';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { AssignConversationUseCase } from '@/core/usecases/AssignConversationUseCase';
import { CloseConversationUseCase } from '@/core/usecases/CloseConversationUseCase';
import { PauseContactFlowUseCase } from '@/core/usecases/PauseContactFlowUseCase';
import { TransferAgentControl } from '@/ui/components/transfer-agent-control';
import { Button } from '@/ui/components/button';

type ConversationActionsProps = {
  contact: string;
  conversation: Conversation | null;
  agents: Agent[];
  operator: User | null;
  onChanged: () => void;
};

export function ConversationActions({
  contact,
  conversation,
  agents,
  operator,
  onChanged,
}: ConversationActionsProps) {
  const closed = conversation?.status === 'closed';
  const assignedToMe =
    Boolean(operator) && conversation?.assignedAgentId === assignmentFromOperator(operator!, agents).agentId;

  const assume = async () => {
    if (!operator) {
      return;
    }
    const assignment = assignmentFromOperator(operator, agents);
    await new AssignConversationUseCase().execute({
      conversationId: contact,
      agentId: assignment.agentId,
      agentName: assignment.agentName,
    });
    await new PauseContactFlowUseCase().execute(contact);
    onChanged();
  };

  const close = async () => {
    await new CloseConversationUseCase().execute(contact);
    onChanged();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {conversation?.assignedAgentName ? (
        <span className="text-xs text-muted-foreground">Atendente: {conversation.assignedAgentName}</span>
      ) : (
        <span className="text-xs text-muted-foreground">Sem atendente</span>
      )}
      {closed ? (
        <span className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
          Finalizada
        </span>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!operator || assignedToMe}
            onClick={() => void assume()}
          >
            Assumir
          </Button>
          <TransferAgentControl conversationId={contact} agents={agents} onTransferred={onChanged} />
          <Button type="button" variant="outline" size="sm" onClick={() => void close()}>
            Finalizar
          </Button>
        </>
      )}
    </div>
  );
}
