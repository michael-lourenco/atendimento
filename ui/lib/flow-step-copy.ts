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

function truncate(text: string, max = 42): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

function stepPreview(step: FlowStep, departments: NamedDepartment[]): string {
  if (step.type === 'action') {
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

export function stepDisplayName(
  step: FlowStep,
  index: number,
  departments: NamedDepartment[] = []
): string {
  const prefix = `${index + 1}. ${STEP_TYPE_LABELS[step.type]}`;
  const preview = stepPreview(step, departments);
  return preview ? `${prefix} — ${preview}` : prefix;
}
