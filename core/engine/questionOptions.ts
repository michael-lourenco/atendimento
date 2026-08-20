import { FlowStep } from '../entities/Flow';

export function listQuestionOptions(step: FlowStep): string[] {
  if (step.type !== 'question') {
    return [];
  }
  const seen = new Set<string>();
  const options: string[] = [];
  for (const option of (step.options ?? []).map((item) => item.trim()).filter(Boolean)) {
    const key = option.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    options.push(option);
  }
  return options;
}
