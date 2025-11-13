export interface FlowStep {
  id: string;
  type: 'message' | 'question' | 'condition' | 'action';
  content: string;
  options?: string[];
  nextStepId?: string;
  condition?: {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string;
    trueStepId: string;
    falseStepId: string;
  };
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  steps: FlowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

