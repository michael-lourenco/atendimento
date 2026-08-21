'use client';

import { Department } from '@/core/entities/Department';
import { DepartmentFilter } from '@/core/entities/conversationDepartment';
import { LineFilter, TagFilter } from '@/core/entities/inboxFilterHint';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { Tag } from '@/core/entities/Tag';
import { Button } from '@/ui/components/button';
import { InboxChimeToggle } from '@/ui/components/inbox-chime-toggle';

type InboxFilterBarProps = {
  numbers: WhatsAppNumber[];
  departments: Department[];
  tags?: Tag[];
  lineFilter: LineFilter;
  departmentFilter: DepartmentFilter;
  tagFilter?: TagFilter;
  mineOnly: boolean;
  onLineFilter: (value: LineFilter) => void;
  onDepartmentFilter: (value: DepartmentFilter) => void;
  onTagFilter?: (value: TagFilter) => void;
  onMineOnly: () => void;
  onHelp?: () => void;
};

export function InboxFilterBar({
  numbers,
  departments,
  tags = [],
  lineFilter,
  departmentFilter,
  tagFilter = 'all',
  mineOnly,
  onLineFilter,
  onDepartmentFilter,
  onTagFilter,
  onMineOnly,
  onHelp,
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
      {tags.length > 0 && onTagFilter ? (
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={tagFilter}
          aria-label="Filtrar por etiqueta"
          onChange={(event) => onTagFilter(event.target.value)}
        >
          <option value="all">Todas as etiquetas</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
      ) : null}
      <Button
        type="button"
        variant={mineOnly ? 'outline' : 'default'}
        size="sm"
        onClick={onMineOnly}
      >
        {mineOnly ? 'Ver o time' : 'Só as minhas'}
      </Button>
      {onHelp ? (
        <Button type="button" variant="outline" size="icon" onClick={onHelp} aria-label="Atalhos da fila">
          ?
        </Button>
      ) : null}
      <InboxChimeToggle />
    </div>
  );
}
