export interface FlowSession {
  contactId: string;
  flowId: string;
  currentStepId: string | null;
  updatedAt: Date;
}
