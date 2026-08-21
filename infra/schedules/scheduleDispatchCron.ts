import { logApiError } from '@/infra/http/apiLog';
import { runDispatchDueScheduledMessages } from './runDispatchDueScheduledMessages';
import {
  SCHEDULE_DISPATCH_INTERVAL_MS,
  shouldStartInProcessScheduleCron,
} from './shouldStartInProcessScheduleCron';

const FIRST_TICK_MS = 5_000;

export function startScheduleDispatchCron(): void {
  if (!shouldStartInProcessScheduleCron()) {
    return;
  }
  const tick = () => {
    void runDispatchDueScheduledMessages().catch(() => {
      logApiError('cron', 'Agendamentos falhou');
    });
  };
  setTimeout(tick, FIRST_TICK_MS);
  setInterval(tick, SCHEDULE_DISPATCH_INTERVAL_MS);
}
