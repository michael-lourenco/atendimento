'use client';

import { Flow } from '@/core/entities/Flow';
import { entryFlowChoices } from '@/ui/lib/chatbot-form';
import { entryFlowSelectLink } from '@/ui/lib/entry-flow-href';
import { Label } from '@/ui/components/label';
import Link from 'next/link';

type EntryFlowSelectProps = {
  id?: string;
  value: string;
  flows: Flow[];
  hint: string;
  onChange: (flowId: string) => void;
};

export function EntryFlowSelect({
  id = 'entry-flow',
  value,
  flows,
  hint,
  onChange,
}: EntryFlowSelectProps) {
  const choices = entryFlowChoices(flows, value);
  const link = entryFlowSelectLink(value);
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Fluxo de entrada</Label>
      <select
        id={id}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {choices.length === 0 ? <option value="">Nenhum fluxo ativo</option> : null}
        {choices.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.isActive ? '' : ' (inativo)'}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {hint}{' '}
        <Link href={link.href} className="underline">
          {link.label}
        </Link>
      </p>
    </div>
  );
}
