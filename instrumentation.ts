export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }
  const { startScheduleDispatchCron } = await import(
    './infra/schedules/scheduleDispatchCron'
  );
  startScheduleDispatchCron();
}
