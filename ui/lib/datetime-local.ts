function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toLocalDatetimeValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultScheduleDatetimeValue(now = new Date()): string {
  return toLocalDatetimeValue(new Date(now.getTime() + 60 * 60 * 1000));
}
