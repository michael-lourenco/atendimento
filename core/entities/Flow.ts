export const FLOW_STEP_MAX_DELAY_MS = 8000;

export type FlowStepMediaKind = 'image' | 'audio';

export interface FlowStep {
  id: string;
  type: 'message' | 'question' | 'condition' | 'action';
  content: string;
  options?: string[];
  /** Só o painel: posição no quadro. O motor ignora. */
  canvasPosition?: { x: number; y: number };
  /** Pausa antes de enviar este passo (0–8000 ms). */
  delayMs?: number;
  mediaUrl?: string;
  mediaKind?: FlowStepMediaKind;
  nextStepId?: string;
  action?:
    | { type: 'setDepartment'; departmentId: string }
    | { type: 'goToFlow'; flowId: string }
    | { type: 'handoff'; departmentId?: string };
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
  /** Se o cliente envia uma destas frases, entra neste fluxo (ativo). */
  keywords?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

