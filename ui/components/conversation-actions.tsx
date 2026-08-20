'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Agent } from '@/core/entities/Agent';
import { Conversation } from '@/core/entities/Conversation';
import { Department } from '@/core/entities/Department';
import { User } from '@/core/entities/User';
import { assignmentFromOperator } from '@/core/entities/assignmentFromOperator';
import {
  agentsAvailableForTransfer,
  departmentNameOf,
} from '@/core/entities/conversationDepartment';
import { TransferAgentControl } from '@/ui/components/transfer-agent-control';
import { ConversationDepartmentControl } from '@/ui/components/conversation-department-control';
import { ActionMenu, ActionMenuItem, ActionMenuLabel } from '@/ui/components/action-menu';

type ConversationActionsProps = {
  conversation: Conversation | null;
  agents: Agent[];
  departments: Department[];
  operator: User | null;
  paused?: boolean;
  onChanged: () => void;
  onSchedule: () => void;
  onResume: () => void;
};

export function ConversationActions({
  conversation,
  agents,
  departments,
  operator,
  paused,
  onChanged,
  onSchedule,
  onResume,
}: ConversationActionsProps) {
  const [confirmClose, setConfirmClose] = useState(false);
  const closed = conversation?.status === 'closed';
  const assignment = operator ? assignmentFromOperator(operator, agents) : null;
  const assignedToMe = Boolean(assignment && conversation?.assignedAgentId === assignment.agentId);
  const transferAgents = agentsAvailableForTransfer(agents, conversation?.departmentId);
  const threadId = conversation?.id;

  const assume = async () => {
    if (!operator || !assignment || !threadId) {
      return;
    }
    await clientUseCases.assignConversation().execute({
      conversationId: threadId,
      agentId: assignment.agentId,
      agentName: assignment.agentName,
      departmentId: assignment.departmentId,
      departmentName: departmentNameOf(departments, assignment.departmentId) || undefined,
    });
    await clientUseCases.pauseContactFlow().execute(threadId);
    onChanged();
  };

  const close = async () => {
    if (!threadId) {
      return;
    }
    await clientUseCases.closeConversation().execute(threadId);
    setConfirmClose(false);
    onChanged();
  };

  return (
    <ActionMenu
      variant="icon"
      align="end"
      ariaLabel="Ações da conversa"
      label={<MoreVertical className="h-5 w-5" />}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmClose(false);
        }
      }}
    >
      {(dismiss) => (
        <>
          <ActionMenuItem
            disabled={!operator || assignedToMe || closed || !threadId}
            onClick={() => {
              void assume().then(dismiss);
            }}
          >
            {assignedToMe ? 'Com você' : 'Assumir'}
          </ActionMenuItem>
          <ActionMenuLabel>Transferir</ActionMenuLabel>
          <TransferAgentControl
            asItems
            conversationId={threadId ?? ''}
            agents={transferAgents}
            currentAgentId={conversation?.assignedAgentId}
            departments={departments}
            disabled={closed}
            onClose={dismiss}
            onTransferred={onChanged}
          />
          <ActionMenuLabel>Setor</ActionMenuLabel>
          <ConversationDepartmentControl
            asItems
            conversationId={threadId ?? ''}
            departmentId={conversation?.departmentId}
            departmentName={conversation?.departmentName}
            departments={departments}
            disabled={closed}
            onClose={dismiss}
            onChanged={onChanged}
          />
          <ActionMenuItem
            disabled={!conversation}
            onClick={() => {
              onSchedule();
              dismiss();
            }}
          >
            Agendar
          </ActionMenuItem>
          {paused ? (
            <ActionMenuItem
              onClick={() => {
                onResume();
                dismiss();
              }}
            >
              Retomar chatbot
            </ActionMenuItem>
          ) : null}
          {closed ? (
            <ActionMenuItem disabled onClick={() => undefined}>
              Finalizada
            </ActionMenuItem>
          ) : confirmClose ? (
            <>
              <ActionMenuItem
                destructive
                onClick={() => {
                  void close().then(dismiss);
                }}
              >
                Confirmar
              </ActionMenuItem>
              <ActionMenuItem
                onClick={() => {
                  setConfirmClose(false);
                }}
              >
                Cancelar
              </ActionMenuItem>
            </>
          ) : (
            <ActionMenuItem
              destructive
              disabled={!threadId}
              onClick={() => {
                setConfirmClose(true);
              }}
            >
              Finalizar
            </ActionMenuItem>
          )}
        </>
      )}
    </ActionMenu>
  );
}
