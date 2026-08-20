'use client';

import {
  BusinessHours,
  WEEKDAYS,
  businessWindows,
  isOvernightWindow,
  setWeekdayClock,
  setWeekdayOpen,
} from '@/core/entities/businessHours';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  enabled: false,
  timezone: 'America/Sao_Paulo',
  days: [1, 2, 3, 4, 5],
  start: '08:00',
  end: '18:00',
  windows: [
    { weekday: 1, start: '08:00', end: '18:00' },
    { weekday: 2, start: '08:00', end: '18:00' },
    { weekday: 3, start: '08:00', end: '18:00' },
    { weekday: 4, start: '08:00', end: '18:00' },
    { weekday: 5, start: '08:00', end: '18:00' },
  ],
  closedMessage:
    'Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Te respondemos nesse horário.',
};

const WEEKDAY_LABEL: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

const TIMEZONES = [
  { id: 'America/Sao_Paulo', label: 'Brasília' },
  { id: 'America/Fortaleza', label: 'Fortaleza' },
  { id: 'America/Recife', label: 'Recife' },
  { id: 'America/Manaus', label: 'Manaus' },
  { id: 'America/Cuiaba', label: 'Cuiabá' },
  { id: 'America/Porto_Velho', label: 'Porto Velho' },
  { id: 'America/Rio_Branco', label: 'Rio Branco' },
  { id: 'America/Noronha', label: 'Fernando de Noronha' },
];

type BusinessHoursFieldsProps = {
  value: BusinessHours;
  onChange: (next: BusinessHours) => void;
};

export function BusinessHoursFields({ value, onChange }: BusinessHoursFieldsProps) {
  const windows = businessWindows(value);
  const timezoneOptions = TIMEZONES.some((item) => item.id === value.timezone)
    ? TIMEZONES
    : [{ id: value.timezone, label: value.timezone }, ...TIMEZONES];

  return (
    <details open className="rounded-md border border-border p-3">
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
        <div className="space-y-1">
          <Label htmlFor="timezone">Fuso</Label>
          <select
            id="timezone"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={value.timezone}
            onChange={(event) => onChange({ ...value, timezone: event.target.value })}
          >
            {timezoneOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Dias e horários</p>
          {WEEKDAYS.map((weekday) => {
            const window = windows.find((item) => item.weekday === weekday);
            return (
              <div key={weekday} className="space-y-1">
                <div className="grid items-center gap-2 sm:grid-cols-[7rem_1fr_1fr]">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(window)}
                      onChange={(event) =>
                        onChange(setWeekdayOpen(value, weekday, event.target.checked))
                      }
                    />
                    {WEEKDAY_LABEL[weekday]}
                  </label>
                  <Input
                    type="time"
                    disabled={!window}
                    value={window?.start ?? value.start}
                    onChange={(event) =>
                      onChange(setWeekdayClock(value, weekday, 'start', event.target.value))
                    }
                    aria-label={`Início ${WEEKDAY_LABEL[weekday]}`}
                  />
                  <Input
                    type="time"
                    disabled={!window}
                    value={window?.end ?? value.end}
                    onChange={(event) =>
                      onChange(setWeekdayClock(value, weekday, 'end', event.target.value))
                    }
                    aria-label={`Fim ${WEEKDAY_LABEL[weekday]}`}
                  />
                </div>
                {window && isOvernightWindow(window.start, window.end) ? (
                  <p className="text-xs text-muted-foreground sm:pl-[7.5rem]">
                    Até o dia seguinte
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="space-y-1">
          <Label htmlFor="closed-message">Aviso fora do horário</Label>
          <Textarea
            id="closed-message"
            rows={2}
            value={value.closedMessage}
            onChange={(event) => onChange({ ...value, closedMessage: event.target.value })}
          />
        </div>
      </div>
    </details>
  );
}
