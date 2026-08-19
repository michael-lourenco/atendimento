import { FlowStep } from '@/core/entities/Flow';
import { listQuestionOptions } from './flow-step-graph';

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
  makeId: (index: number) => string = (index) => `step-${Date.now()}-${index}`
): FlowStep[] {
  const question = steps[questionIndex];
  if (!question || question.type !== 'question') {
    return steps;
  }
  const options = listQuestionOptions(question);
  if (options.length === 0) {
    return steps;
  }

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
    const fresh = makeCondition(makeId(created.length), option);
    created.push(fresh);
    return fresh;
  });

  const usedIds = new Set(ordered.map((step) => step.id));
  const leftoverId = conditions.find((step) => !usedIds.has(step.id))?.id;
  const tailId = leftoverId ?? fallbackId;

  const relinked = ordered.map((step, index) => {
    const isNew = created.some((item) => item.id === step.id);
    const falseStepId = index < ordered.length - 1 ? ordered[index + 1].id : tailId;
    return {
      ...step,
      condition: {
        field: 'content' as const,
        operator: isNew ? ('equals' as const) : step.condition!.operator,
        value: isNew ? options[index] : step.condition!.value,
        trueStepId: step.condition?.trueStepId ?? '',
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
  return [...updated.slice(0, insertAt), ...created.map((step) => byId.get(step.id)!), ...updated.slice(insertAt)];
}
