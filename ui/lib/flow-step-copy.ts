import { FlowStep } from '@/core/entities/Flow';

export const STEP_TYPE_LABELS: Record<FlowStep['type'], string> = {
  message: 'Mensagem',
  question: 'Pergunta',
  condition: 'Condição',
  action: 'Definir setor',
};

export const CONDITION_OPERATOR_LABELS: Record<
  NonNullable<FlowStep['condition']>['operator'],
  string
> = {
  contains: 'contém',
  equals: 'é igual a',
  greaterThan: 'é maior que',
  lessThan: 'é menor que',
};

export const END_STEP_LABEL = 'Encerrar atendimento';

type NamedDepartment = { id: string; name: string };
type NamedFlow = { id: string; name: string };

function truncate(text: string, max = 42): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

function stepTypeLabel(step: FlowStep): string {
  if (step.action?.type === 'goToFlow') {
    return 'Ir para fluxo';
  }
  return STEP_TYPE_LABELS[step.type];
}

function stepPreview(
  step: FlowStep,
  departments: NamedDepartment[],
  flows: NamedFlow[]
): string {
  if (step.action?.type === 'goToFlow') {
    return flows.find((item) => item.id === step.action?.flowId)?.name ?? '';
  }
  if (step.type === 'action' && step.action?.type === 'setDepartment') {
    return departments.find((item) => item.id === step.action?.departmentId)?.name ?? '';
  }
  if (step.type === 'condition') {
    const value = step.condition?.value?.trim() ?? '';
    if (!value) {
      return '';
    }
    const operator = CONDITION_OPERATOR_LABELS[step.condition?.operator ?? 'contains'];
    return `${operator} “${truncate(value, 24)}”`;
  }
  return truncate(step.content ?? '');
}

export function stepCollapsedHint(
  step: FlowStep,
  departments: NamedDepartment[] = [],
  flows: NamedFlow[] = []
): string {
  if (step.type === 'question') {
    const count = (step.options ?? []).map((item) => item.trim()).filter(Boolean).length;
    return count === 1 ? '1 opção' : `${count} opções`;
  }
  if (step.action?.type === 'goToFlow') {
    return flows.find((item) => item.id === step.action.flowId)?.name || 'sem fluxo';
  }
  if (step.type === 'action') {
    const departmentId = step.action?.type === 'setDepartment' ? step.action.departmentId : '';
    return departments.find((item) => item.id === departmentId)?.name || 'sem setor';
  }
  if (step.type === 'condition') {
    return stepPreview(step, departments, flows) || 'sem regra';
  }
  const text = (step.content ?? '').trim();
  return text ? truncate(text, 56) : 'sem texto';
}

export function stepDisplayName(
  step: FlowStep,
  index: number,
  departments: NamedDepartment[] = [],
  flows: NamedFlow[] = []
): string {
  const prefix = `${index + 1}. ${stepTypeLabel(step)}`;
  const preview = stepPreview(step, departments, flows);
  return preview ? `${prefix} — ${preview}` : prefix;
}
