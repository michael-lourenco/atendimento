import { FLOW_STEP_MAX_DELAY_MS } from '../entities/Flow';

export function clampFlowDelayMs(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(Math.round(value), FLOW_STEP_MAX_DELAY_MS);
}
