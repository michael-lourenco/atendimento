'use client';

import Link from 'next/link';
import { DashboardSetupCheck } from '@/ui/lib/dashboard-setup';

type DashboardSetupChecklistProps = {
  pending: DashboardSetupCheck[];
};

export function DashboardSetupChecklist({ pending }: DashboardSetupChecklistProps) {
  if (pending.length === 0) {
    return null;
  }
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
      <p className="font-medium text-foreground">Primeiro uso</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted-foreground">
        {pending.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
