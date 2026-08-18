import { FlowStep } from '../entities/Flow';

export function evaluateCondition(
  condition: NonNullable<FlowStep['condition']>,
  incomingText: string
): boolean {
  if (condition.field !== 'content') {
    return false;
  }

  const left = incomingText.trim();
  const right = condition.value.trim();

  switch (condition.operator) {
    case 'equals':
      return left.toLowerCase() === right.toLowerCase();
    case 'contains':
      return left.toLowerCase().includes(right.toLowerCase());
    case 'greaterThan': {
      const leftNum = Number(left);
      const rightNum = Number(right);
      if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) {
        return false;
      }
      return leftNum > rightNum;
    }
    case 'lessThan': {
      const leftNum = Number(left);
      const rightNum = Number(right);
      if (Number.isNaN(leftNum) || Number.isNaN(rightNum)) {
        return false;
      }
      return leftNum < rightNum;
    }
    default:
      return false;
  }
}
