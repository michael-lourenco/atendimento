import { Flow, FlowStep } from '@/core/entities/Flow';

export type FlowSimCursor = {
  flowId: string;
  stepId: string | null;
};

export function stepsForSimCanvas(
  editorSteps: FlowStep[],
  editorFlowId: string | undefined,
  catalog: Flow[],
  cursor: FlowSimCursor | null
): FlowStep[] {
  if (!cursor || !cursor.flowId || cursor.flowId === editorFlowId) {
    return editorSteps;
  }
  return catalog.find((item) => item.id === cursor.flowId)?.steps ?? editorSteps;
}

export function isSimCanvasReadOnly(
  editorFlowId: string | undefined,
  cursor: FlowSimCursor | null
): boolean {
  return Boolean(cursor && editorFlowId && cursor.flowId !== editorFlowId);
}
