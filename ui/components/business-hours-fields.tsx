'use client';

import { BusinessHours } from '@/core/entities/businessHours';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  enabled: false,
  timezone: 'America/Sao_Paulo',
  days: [1, 2, 3, 4, 5],
  start: '08:00',
  end: '18:00',
  closedMessage:
    'Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Te respondemos nesse horário.',
};

type BusinessHoursFieldsProps = {
  value: BusinessHours;
  onChange: (next: BusinessHours) => void;
};

export function BusinessHoursFields({ value, onChange }: BusinessHoursFieldsProps) {
  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Expediente no WhatsApp</summary>
      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          />
          Fora do horário, só avisar (não seguir o fluxo)
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Início</Label>
            <Input
              type="time"
              value={value.start}
              onChange={(event) => onChange({ ...value, start: event.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Fim</Label>
            <Input
              type="time"
              value={value.end}
              onChange={(event) => onChange({ ...value, end: event.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Fuso</Label>
          <Input
            value={value.timezone}
            onChange={(event) => onChange({ ...value, timezone: event.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label>Aviso fora do horário</Label>
          <Textarea
            rows={2}
            value={value.closedMessage}
            onChange={(event) => onChange({ ...value, closedMessage: event.target.value })}
          />
        </div>
      </div>
    </details>
  );
}
