import { FlowStep } from '../entities/Flow';

const OPTION_INDEX = /^(\d{1,2})(?:[.)])?\s*$/;

export function parseOptionIndex(text: string): number | null {
  const match = text.trim().match(OPTION_INDEX);
  if (!match) {
    return null;
  }
  const index = Number(match[1]);
  if (!Number.isInteger(index) || index < 1) {
    return null;
  }
  return index;
}

export function resolveQuestionChoice(
  question: Pick<FlowStep, 'options'>,
  incomingText: string
): string {
  const options = (question.options ?? []).map((option) => option.trim()).filter(Boolean);
  const index = parseOptionIndex(incomingText);
  if (index === null || index > options.length) {
    return incomingText;
  }
  return options[index - 1];
}
