export type BusinessHours = {
  enabled: boolean;
  timezone: string;
  days: number[];
  start: string;
  end: string;
  closedMessage: string;
};

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function minutesFromClock(value: string): number {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

export function isWithinBusinessHours(hours: BusinessHours | undefined, now: Date): boolean {
  if (!hours?.enabled) {
    return true;
  }
  const timezone = hours.timezone.trim() || 'America/Sao_Paulo';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = WEEKDAY[parts.find((part) => part.type === 'weekday')?.value ?? ''] ?? -1;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  if (!hours.days.includes(weekday)) {
    return false;
  }
  const clock = hour * 60 + minute;
  return clock >= minutesFromClock(hours.start) && clock < minutesFromClock(hours.end);
}

export function activeBusinessHours(
  chatbots: { isActive: boolean; businessHours?: BusinessHours }[]
): BusinessHours | undefined {
  return chatbots.find((item) => item.isActive)?.businessHours;
}
