'use client';

import { Department } from '@/core/entities/Department';
import { SetConversationDepartmentUseCase } from '@/core/usecases/SetConversationDepartmentUseCase';
import { ActionMenu, ActionMenuItem } from '@/ui/components/action-menu';

type ConversationDepartmentControlProps = {
  conversationId: string;
  departmentId?: string;
  departmentName?: string;
  departments: Department[];
  disabled?: boolean;
  onChanged?: () => void;
};

export function ConversationDepartmentControl({
  conversationId,
  departmentId,
  departmentName,
  departments,
  disabled,
  onChanged,
}: ConversationDepartmentControlProps) {
  const active = departments.filter((item) => item.isActive);
  const current = active.find((item) => item.id === departmentId);
  const color = current?.color;

  const change = async (nextId: string) => {
    const department = active.find((item) => item.id === nextId);
    await new SetConversationDepartmentUseCase().execute({
      conversationId,
      departmentId: nextId,
      departmentName: department?.name ?? '',
    });
    onChanged?.();
  };

  if (active.length === 0) {
    return <span className="text-xs text-muted-foreground">Cadastre um setor</span>;
  }

  return (
    <ActionMenu
      disabled={disabled}
      ariaLabel="Setor da conversa"
      label={
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: color || 'hsl(var(--muted-foreground))' }}
          />
          {departmentName || current?.name || 'Sem setor'}
        </span>
      }
    >
      {(close) => (
        <>
          <ActionMenuItem
            active={!departmentId}
            onClick={() => {
              void change('').then(close);
            }}
          >
            Sem setor
          </ActionMenuItem>
          {active.map((department) => (
            <ActionMenuItem
              key={department.id}
              active={department.id === departmentId}
              onClick={() => {
                void change(department.id).then(close);
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: department.color }}
              />
              {department.name}
            </ActionMenuItem>
          ))}
        </>
      )}
    </ActionMenu>
  );
}
