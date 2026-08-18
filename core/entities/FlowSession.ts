export interface FlowSession {
  contactId: string;
  flowId: string;
  currentStepId: string | null;
  paused: boolean;
  updatedAt: Date;
}
