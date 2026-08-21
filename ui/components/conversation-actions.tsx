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
import { Button } from '@/ui/components/button';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';

type ConversationActionsProps = {
  conversation: Conversation | null;
  agents: Agent[];
  departments: Department[];
  operator: User | null;
  paused?: boolean;
  onChanged: () => void;
  onClosed?: (conversationId: string) => void;
  onSchedule: () => void;
  onResume: () => void;
  onFlash?: (kind: 'success' | 'error', message: string) => void;
};

export function ConversationActions({
  conversation,
  agents,
  departments,
  operator,
  paused,
  onChanged,
  onClosed,
  onSchedule,
  onResume,
  onFlash,
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
    try {
      await clientUseCases.assignConversation().execute({
        conversationId: threadId,
        agentId: assignment.agentId,
        agentName: assignment.agentName,
        departmentId: assignment.departmentId,
        departmentName: departmentNameOf(departments, assignment.departmentId) || undefined,
      });
      await clientUseCases.pauseContactFlow().execute(threadId);
      onFlash?.('success', 'Conversa com você');
      onChanged();
    } catch (error) {
      onFlash?.('error', catalogPersistErrorMessage(error, 'conversations'));
    }
  };

  const close = async () => {
    if (!threadId) {
      return;
    }
    try {
      await clientUseCases.closeConversation().execute(threadId);
      setConfirmClose(false);
      onClosed?.(threadId);
      onChanged();
    } catch (error) {
      onFlash?.('error', catalogPersistErrorMessage(error, 'conversations'));
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={assignedToMe ? 'secondary' : 'default'}
        disabled={!operator || closed || !threadId || assignedToMe}
        onClick={() => void assume()}
      >
        {assignedToMe ? 'Com você' : 'Assumir'}
      </Button>
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
            <ActionMenuLabel>Transferir</ActionMenuLabel>
            <TransferAgentControl
              asItems
              conversationId={threadId ?? ''}
              agents={transferAgents}
              currentAgentId={conversation?.assignedAgentId}
              departments={departments}
              disabled={closed}
              onClose={dismiss}
              onTransferred={(name) => {
                onFlash?.('success', `Transferida para ${name}. Foi para Esperando.`);
                onChanged();
              }}
              onError={(text) => onFlash?.('error', text)}
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
    </div>
  );
}
