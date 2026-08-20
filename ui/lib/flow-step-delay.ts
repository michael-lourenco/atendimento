import { FLOW_STEP_MAX_DELAY_MS } from '@/core/entities/Flow';
import { msToSeconds, secondsToMs } from '@/core/entities/botBehavior';
import { clampFlowDelayMs } from '@/core/engine/clampFlowDelayMs';

export const FLOW_STEP_MAX_DELAY_SECONDS = FLOW_STEP_MAX_DELAY_MS / 1000;

export function flowStepDelaySeconds(delayMs?: number): number {
  return msToSeconds(delayMs ?? 0);
}

export function flowStepDelayMsFromSeconds(seconds: unknown): number {
  return clampFlowDelayMs(secondsToMs(seconds, 0));
}
