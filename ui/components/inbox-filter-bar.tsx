'use client';

import { Department } from '@/core/entities/Department';
import { DepartmentFilter } from '@/core/entities/conversationDepartment';
import { LineFilter } from '@/core/entities/inboxFilterHint';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { Button } from '@/ui/components/button';
import { InboxChimeToggle } from '@/ui/components/inbox-chime-toggle';

type InboxFilterBarProps = {
  numbers: WhatsAppNumber[];
  departments: Department[];
  lineFilter: LineFilter;
  departmentFilter: DepartmentFilter;
  mineOnly: boolean;
  onLineFilter: (value: LineFilter) => void;
  onDepartmentFilter: (value: DepartmentFilter) => void;
  onMineOnly: () => void;
};

export function InboxFilterBar({
  numbers,
  departments,
  lineFilter,
  departmentFilter,
  mineOnly,
  onLineFilter,
  onDepartmentFilter,
  onMineOnly,
}: InboxFilterBarProps) {
  const selectedColor =
    departmentFilter !== 'all' && departmentFilter !== 'none'
      ? departments.find((item) => item.id === departmentFilter)?.color
      : undefined;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {numbers.length > 0 ? (
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={lineFilter}
          aria-label="Filtrar por linha"
          onChange={(event) => onLineFilter(event.target.value)}
        >
          <option value="all">Todas as linhas</option>
          {numbers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : null}
      <select
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        value={departmentFilter}
        aria-label="Filtrar por setor"
        onChange={(event) => onDepartmentFilter(event.target.value)}
        style={
          selectedColor
            ? { borderLeftWidth: 6, borderLeftColor: selectedColor }
            : undefined
        }
      >
        <option value="all">Todos os setores</option>
        <option value="none">Sem setor</option>
        {departments
          .filter((item) => item.isActive)
          .map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
      </select>
      <Button
        type="button"
        variant={mineOnly ? 'outline' : 'default'}
        size="sm"
        onClick={onMineOnly}
      >
        {mineOnly ? 'Ver o time' : 'Só as minhas'}
      </Button>
      <InboxChimeToggle />
    </div>
  );
}
