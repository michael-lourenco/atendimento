'use client';

import { useEffect, useState } from 'react';
import { SchemaHealthReport } from '@/core/entities/schemaHealth';
import { Button } from '@/ui/components/button';

export function SchemaHealthBanner() {
  const [report, setReport] = useState<SchemaHealthReport | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/admin/schema-health');
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as SchemaHealthReport;
        if (!cancelled) {
          setReport(body);
        }
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden || !report || report.ok || report.issues.length === 0) {
    return null;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report.sql);
    } catch {
      return;
    }
  };

  return (
    <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-3 text-sm sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">Banco desatualizado</p>
          <p className="text-muted-foreground">
            Faltam {report.issues.length} coluna(s) no Supabase. Cole o SQL no SQL Editor e rode.
          </p>
          <pre className="max-h-40 overflow-auto rounded-md bg-card p-2 text-xs text-foreground">
            {report.sql}
          </pre>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
            Copiar SQL
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setHidden(true)}>
            Ocultar
          </Button>
        </div>
      </div>
    </div>
  );
}
