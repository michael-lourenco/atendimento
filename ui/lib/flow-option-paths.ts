import { FlowStep } from '@/core/entities/Flow';
import { listQuestionOptions } from './flow-step-graph';

export type OptionPathDestination = {
  type: 'end' | 'department' | 'message' | 'flow';
  departmentId?: string;
  message?: string;
  flowId?: string;
};

function conditionCoversOption(option: string, value: string): boolean {
  const optionText = option.trim().toLowerCase();
  const conditionText = value.trim().toLowerCase();
  if (!optionText || !conditionText) {
    return false;
  }
  return (
    optionText === conditionText ||
    optionText.includes(conditionText) ||
    conditionText.includes(optionText)
  );
}

function findStep(steps: FlowStep[], id?: string): FlowStep | undefined {
  if (!id) {
    return undefined;
  }
  return steps.find((step) => step.id === id);
}

function walkFalseConditionChain(
  steps: FlowStep[],
  startId?: string
): { conditions: FlowStep[]; fallbackId: string } {
  const conditions: FlowStep[] = [];
  const seen = new Set<string>();
  let cursorId = startId;
  let fallbackId = '';

  while (cursorId && !seen.has(cursorId)) {
    seen.add(cursorId);
    const step = findStep(steps, cursorId);
    if (!step || step.type !== 'condition' || !step.condition) {
      fallbackId = cursorId;
      break;
    }
    conditions.push(step);
    cursorId = step.condition.falseStepId || undefined;
    if (!cursorId) {
      fallbackId = '';
      break;
    }
  }

  return { conditions, fallbackId };
}

export function conditionsOwnedByQuestion(steps: FlowStep[], question: FlowStep): FlowStep[] {
  if (question.type !== 'question') {
    return [];
  }
  const { conditions } = walkFalseConditionChain(steps, question.nextStepId);
  if (!question.nextStepId || conditions[0]?.id !== question.nextStepId) {
    return [];
  }
  return conditions;
}

export function trueStepIdForOption(
  steps: FlowStep[],
  question: FlowStep,
  option: string
): string {
  const match = conditionsOwnedByQuestion(steps, question).find((step) =>
    conditionCoversOption(option, step.condition?.value ?? '')
  );
  return match?.condition?.trueStepId ?? '';
}

export function setOptionTrueStepId(
  steps: FlowStep[],
  questionId: string,
  option: string,
  targetId: string
): FlowStep[] {
  const questionIndex = steps.findIndex((step) => step.id === questionId);
  const question = steps[questionIndex];
  if (!question || question.type !== 'question') {
    return steps;
  }
  const next = hasCompleteOptionPaths(steps, questionIndex)
    ? steps
    : createOptionPaths(steps, questionIndex);
  const match = conditionsOwnedByQuestion(next, next[questionIndex]).find((step) =>
    conditionCoversOption(option, step.condition?.value ?? '')
  );
  if (!match?.condition) {
    return next;
  }
  return next.map((step) =>
    step.id === match.id
      ? { ...step, condition: { ...match.condition!, trueStepId: targetId } }
      : step
  );
}

function makeCondition(id: string, option: string): FlowStep {
  return {
    id,
    type: 'condition',
    content: '',
    condition: {
      field: 'content',
      operator: 'equals',
      value: option,
      trueStepId: '',
      falseStepId: '',
    },
  };
}

function makeDestination(id: string, dest: OptionPathDestination): FlowStep | null {
  if (dest.type === 'department' && dest.departmentId) {
    return {
      id,
      type: 'action',
      content: '',
      action: { type: 'setDepartment', departmentId: dest.departmentId },
    };
  }
  if (dest.type === 'flow' && dest.flowId) {
    return {
      id,
      type: 'action',
      content: '',
      action: { type: 'goToFlow', flowId: dest.flowId },
    };
  }
  if (dest.type === 'message' && dest.message?.trim()) {
    return { id, type: 'message', content: dest.message.trim() };
  }
  return null;
}

export function destinationsSyncKey(
  options: string[],
  departments: { id: string; name: string }[]
): string {
  return `${options.join('\n')}::${departments.map((item) => `${item.id}:${item.name}`).join('|')}`;
}

export function defaultOptionDestinations(
  options: string[],
  departments: { id: string; name: string }[]
): Record<string, OptionPathDestination> {
  const result: Record<string, OptionPathDestination> = {};
  for (const option of options) {
    const needle = option.trim().toLowerCase();
    const exact = departments.find((item) => item.name.trim().toLowerCase() === needle);
    const partial = departments.find((item) => needle.includes(item.name.trim().toLowerCase()));
    const match = exact ?? partial;
    result[option] = match
      ? { type: 'department', departmentId: match.id }
      : { type: 'end' };
  }
  return result;
}

export function hasCompleteOptionPaths(steps: FlowStep[], questionIndex: number): boolean {
  const question = steps[questionIndex];
  if (!question || question.type !== 'question') {
    return false;
  }
  const options = listQuestionOptions(question);
  if (options.length === 0) {
    return false;
  }
  const { conditions } = walkFalseConditionChain(steps, question.nextStepId);
  if (conditions[0]?.id !== question.nextStepId) {
    return false;
  }
  return options.every((option) =>
    conditions.some((step) => conditionCoversOption(option, step.condition?.value ?? ''))
  );
}

export function createOptionPaths(
  steps: FlowStep[],
  questionIndex: number,
  makeId: (index: number) => string = (index) => `step-${Date.now()}-${index}`,
  destinations: Record<string, OptionPathDestination> = {}
): FlowStep[] {
  const question = steps[questionIndex];
  if (!question || question.type !== 'question') {
    return steps;
  }
  const options = listQuestionOptions(question);
  if (options.length === 0) {
    return steps;
  }

  let idSeq = 0;
  const nextId = () => makeId(idSeq++);
  const { conditions, fallbackId } = walkFalseConditionChain(steps, question.nextStepId);
  const byOption = new Map<string, FlowStep>();
  for (const condition of conditions) {
    const match = options.find((option) =>
      conditionCoversOption(option, condition.condition?.value ?? '')
    );
    if (match && !byOption.has(match.toLowerCase())) {
      byOption.set(match.toLowerCase(), condition);
    }
  }

  const created: FlowStep[] = [];
  const ordered: FlowStep[] = options.map((option) => {
    const existing = byOption.get(option.toLowerCase());
    if (existing) {
      return existing;
    }
    const fresh = makeCondition(nextId(), option);
    created.push(fresh);
    return fresh;
  });

  const usedIds = new Set(ordered.map((step) => step.id));
  const leftoverId = conditions.find((step) => !usedIds.has(step.id))?.id;
  const tailId = leftoverId ?? fallbackId;

  const destSteps: FlowStep[] = [];
  const relinked = ordered.map((step, index) => {
    const isNew = created.some((item) => item.id === step.id);
    const falseStepId = index < ordered.length - 1 ? ordered[index + 1].id : tailId;
    let trueStepId = step.condition?.trueStepId ?? '';
    if (!trueStepId) {
      const built = makeDestination(nextId(), destinations[options[index]] ?? { type: 'end' });
      if (built) {
        destSteps.push(built);
        trueStepId = built.id;
      }
    }
    return {
      ...step,
      condition: {
        field: 'content' as const,
        operator: isNew ? ('equals' as const) : step.condition!.operator,
        value: isNew ? options[index] : step.condition!.value,
        trueStepId,
        falseStepId,
      },
    };
  });

  const byId = new Map(relinked.map((step) => [step.id, step]));
  const updated = steps.map((step) => {
    if (step.id === question.id) {
      return { ...step, nextStepId: relinked[0].id };
    }
    return byId.get(step.id) ?? step;
  });

  const insertAt = updated.findIndex((step) => step.id === question.id) + 1;
  return [
    ...updated.slice(0, insertAt),
    ...created.map((step) => byId.get(step.id)!),
    ...destSteps,
    ...updated.slice(insertAt),
  ];
}
