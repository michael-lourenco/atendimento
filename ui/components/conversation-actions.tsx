'use client';

import { useState } from 'react';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import { agentsForDepartment, departmentNameOf } from '@/core/entities/conversationDepartment';
import { AssignConversationUseCase } from '@/core/usecases/AssignConversationUseCase';
import { CloseConversationUseCase } from '@/core/usecases/CloseConversationUseCase';
import { PauseContactFlowUseCase } from '@/core/usecases/PauseContactFlowUseCase';
import { TransferAgentControl } from '@/ui/components/transfer-agent-control';
import { ConversationDepartmentControl } from '@/ui/components/conversation-department-control';
import { Button } from '@/ui/components/button';

type ConversationActionsProps = {
  contact: string;
  conversation: Conversation | null;
  agents: Agent[];
  departments: Department[];
  operator: User | null;
  onChanged: () => void;
};

export function ConversationActions({
  contact,
  conversation,
  agents,
  departments,
  operator,
  onChanged,
}: ConversationActionsProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const closed = conversation?.status === 'closed';
  const assignment = operator ? assignmentFromOperator(operator, agents) : null;
  const assignedToMe = Boolean(assignment && conversation?.assignedAgentId === assignment.agentId);
  const transferAgents = agentsForDepartment(agents, conversation?.departmentId);

  const assume = async () => {
    if (!operator || !assignment) {
      return;
    }
    await new AssignConversationUseCase().execute({
      conversationId: contact,
      agentId: assignment.agentId,
      agentName: assignment.agentName,
      departmentId: assignment.departmentId,
      departmentName: departmentNameOf(departments, assignment.departmentId) || undefined,
    });
    await new PauseContactFlowUseCase().execute(contact);
    onChanged();
  };

  const close = async () => {
    await new CloseConversationUseCase().execute(contact);
    setConfirmClose(false);
    onChanged();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {conversation?.assignedAgentName
            ? `Com ${conversation.assignedAgentName}`
            : 'Sem atendente'}
        </span>
        <ConversationDepartmentControl
          conversationId={contact}
          departmentId={conversation?.departmentId}
          departmentName={conversation?.departmentName}
          departments={departments}
          disabled={closed}
          onChanged={onChanged}
        />
      </div>
      {closed ? (
        <span className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
          Finalizada
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={assignedToMe ? 'outline' : 'default'}
            disabled={!operator || assignedToMe}
            onClick={() => void assume()}
          >
            {assignedToMe ? 'Com você' : 'Assumir'}
          </Button>
          <TransferAgentControl
            conversationId={contact}
            agents={transferAgents}
            currentAgentId={conversation?.assignedAgentId}
            departments={departments}
            onTransferred={onChanged}
          />
          {confirmClose ? (
            <>
              <Button type="button" variant="destructive" size="sm" onClick={() => void close()}>
                Confirmar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmClose(false)}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmClose(true)}
            >
              Finalizar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
