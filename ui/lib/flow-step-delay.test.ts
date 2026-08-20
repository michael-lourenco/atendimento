import { FLOW_STEP_MAX_DELAY_MS } from '@/core/entities/Flow';
import {
  FLOW_STEP_MAX_DELAY_SECONDS,
  flowStepDelayMsFromSeconds,
  flowStepDelaySeconds,
} from './flow-step-delay';

describe('flowStepDelay', () => {
  it('mostra segundos e grava delayMs', () => {
    expect(flowStepDelaySeconds(1500)).toBe(1.5);
    expect(flowStepDelayMsFromSeconds(1.5)).toBe(1500);
  });

  it('teto 0–8 segundos (0–8000 ms)', () => {
    expect(FLOW_STEP_MAX_DELAY_SECONDS).toBe(8);
    expect(flowStepDelayMsFromSeconds(0)).toBe(0);
    expect(flowStepDelayMsFromSeconds(8)).toBe(FLOW_STEP_MAX_DELAY_MS);
    expect(flowStepDelayMsFromSeconds(9)).toBe(FLOW_STEP_MAX_DELAY_MS);
  });
});
