export type BusinessDayWindow = {
  weekday: number;
  start: string;
  end: string;
};

export type BusinessHours = {
  enabled: boolean;
  timezone: string;
  days: number[];
  start: string;
  end: string;
  windows?: BusinessDayWindow[];
  closedMessage: string;
};

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0] as const;

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

function clampWeekday(value: number): number | null {
  if (!Number.isInteger(value) || value < 0 || value > 6) {
    return null;
  }
  return value;
}

export function isOvernightWindow(start: string, end: string): boolean {
  return minutesFromClock(start) > minutesFromClock(end);
}

function previousWeekday(weekday: number): number {
  return (weekday + 6) % 7;
}

function clockMatchesWindows(
  windows: BusinessDayWindow[],
  weekday: number,
  clock: number
): boolean {
  const today = windows.find((item) => item.weekday === weekday);
  if (today) {
    const start = minutesFromClock(today.start);
    const end = minutesFromClock(today.end);
    if (start === end) {
      return true;
    }
    if (start < end) {
      if (clock >= start && clock < end) {
        return true;
      }
    } else if (clock >= start) {
      return true;
    }
  }
  const yesterday = windows.find((item) => item.weekday === previousWeekday(weekday));
  if (!yesterday) {
    return false;
  }
  const start = minutesFromClock(yesterday.start);
  const end = minutesFromClock(yesterday.end);
  return start > end && clock < end;
}

export function businessWindows(hours: BusinessHours): BusinessDayWindow[] {
  if (hours.windows) {
    const unique = new Map<number, BusinessDayWindow>();
    for (const window of hours.windows) {
      const weekday = clampWeekday(window.weekday);
      if (weekday === null) {
        continue;
      }
      unique.set(weekday, {
        weekday,
        start: window.start || hours.start || '08:00',
        end: window.end || hours.end || '18:00',
      });
    }
    return WEEKDAYS.map((weekday) => unique.get(weekday)).filter(
      (item): item is BusinessDayWindow => Boolean(item)
    );
  }
  return (hours.days ?? [])
    .map((weekday) => clampWeekday(weekday))
    .filter((weekday): weekday is number => weekday !== null)
    .map((weekday) => ({
      weekday,
      start: hours.start || '08:00',
      end: hours.end || '18:00',
    }));
}

export function syncBusinessHoursLegacy(hours: BusinessHours): BusinessHours {
  const windows = businessWindows(hours);
  const first = windows[0];
  return {
    ...hours,
    windows,
    days: windows.map((item) => item.weekday),
    start: first?.start ?? hours.start ?? '08:00',
    end: first?.end ?? hours.end ?? '18:00',
  };
}

export function setWeekdayOpen(
  hours: BusinessHours,
  weekday: number,
  open: boolean
): BusinessHours {
  const current = businessWindows(hours);
  const without = current.filter((item) => item.weekday !== weekday);
  if (!open) {
    return syncBusinessHoursLegacy({ ...hours, windows: without });
  }
  if (current.some((item) => item.weekday === weekday)) {
    return syncBusinessHoursLegacy({ ...hours, windows: current });
  }
  const template = current[0] ?? { start: hours.start || '08:00', end: hours.end || '18:00' };
  return syncBusinessHoursLegacy({
    ...hours,
    windows: [...without, { weekday, start: template.start, end: template.end }],
  });
}

export function setWeekdayClock(
  hours: BusinessHours,
  weekday: number,
  field: 'start' | 'end',
  value: string
): BusinessHours {
  const opened = businessWindows(hours).some((item) => item.weekday === weekday)
    ? hours
    : setWeekdayOpen(hours, weekday, true);
  const windows = businessWindows(opened).map((item) =>
    item.weekday === weekday ? { ...item, [field]: value } : item
  );
  return syncBusinessHoursLegacy({ ...opened, windows });
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
  const clock = hour * 60 + minute;
  return clockMatchesWindows(businessWindows(hours), weekday, clock);
}

export function activeBusinessHours(
  chatbots: { isActive: boolean; businessHours?: BusinessHours }[]
): BusinessHours | undefined {
  return chatbots.find((item) => item.isActive)?.businessHours;
}

export function hasCustomLineHours(hours?: BusinessHours | null): boolean {
  return Boolean(hours);
}

export function resolveBusinessHours(
  chatbots: { isActive: boolean; businessHours?: BusinessHours }[] | null | undefined,
  lineHours?: BusinessHours | null
): BusinessHours | undefined {
  if (hasCustomLineHours(lineHours)) {
    return lineHours ?? undefined;
  }
  return activeBusinessHours(chatbots ?? []);
}
