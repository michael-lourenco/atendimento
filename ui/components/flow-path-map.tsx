'use client';

import { FlowStep } from '@/core/entities/Flow';
import { flowPathLinks } from '@/ui/lib/flow-path-map';
import { flowPathLabelClass } from '@/ui/lib/status-tone';

type FlowPathMapProps = {
  steps: FlowStep[];
  departments: { id: string; name: string }[];
};

export function FlowPathMap({ steps, departments }: FlowPathMapProps) {
  if (steps.length === 0) {
    return null;
  }
  const links = flowPathLinks(steps, departments);

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mapa do fluxo</p>
      <ul className="space-y-1 text-sm">
        {links.map((link) => (
          <li key={`${link.fromId}-${link.label}`} className="text-foreground">
            <span className="font-medium">{link.fromLabel}</span>
            <span className={flowPathLabelClass[link.label] ?? 'text-muted-foreground'}>
              {' '}
              → {link.label} →{' '}
            </span>
            {link.toLabel}
          </li>
        ))}
      </ul>
    </div>
  );
}
