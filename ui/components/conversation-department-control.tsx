'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { Department } from '@/core/entities/Department';
import { ActionMenu, ActionMenuItem } from '@/ui/components/action-menu';

type ConversationDepartmentControlProps = {
  conversationId: string;
  departmentId?: string;
  departmentName?: string;
  departments: Department[];
  disabled?: boolean;
  asItems?: boolean;
  onClose?: () => void;
  onChanged?: () => void;
};

export function ConversationDepartmentControl({
  conversationId,
  departmentId,
  departmentName,
  departments,
  disabled,
  asItems,
  onClose,
  onChanged,
}: ConversationDepartmentControlProps) {
  const active = departments.filter((item) => item.isActive);
  const current = active.find((item) => item.id === departmentId);
  const color = current?.color;

  const change = async (nextId: string) => {
    const department = active.find((item) => item.id === nextId);
    await clientUseCases.setConversationDepartment().execute({
      conversationId,
      departmentId: nextId,
      departmentName: department?.name ?? '',
    });
    onChanged?.();
  };

  const items = (close: () => void) => (
    <>
      <ActionMenuItem
        active={!departmentId}
        disabled={disabled}
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
          disabled={disabled}
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
  );

  if (active.length === 0) {
    return <span className="px-2 py-1.5 text-xs text-muted-foreground">Cadastre um setor</span>;
  }

  if (asItems) {
    return items(onClose ?? (() => undefined));
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
      {(close) => items(close)}
    </ActionMenu>
  );
}
