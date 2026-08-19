'use client';

export async function dispatchDueSchedules(): Promise<void> {
  await fetch('/api/schedules/dispatch', { method: 'POST' });
}
