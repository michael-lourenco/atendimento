export type FlowReturnFrame = {
  flowId: string;
  resumeStepId: string | null;
};

export interface FlowSession {
  contactId: string;
  flowId: string;
  currentStepId: string | null;
  paused: boolean;
  /** Origem após `goToFlow`: quando o destino acaba, retoma `resumeStepId`. */
  returnStack?: FlowReturnFrame[];
  outsideHoursNotified?: boolean;
  updatedAt: Date;
}
