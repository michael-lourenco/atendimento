export const DEFAULT_HUMAN_HANDOFF_KEYWORDS = [
  'humano',
  'atendente',
  'falar com humano',
  '0',
];

export function matchesHumanHandoff(
  incomingText: string,
  keywords: string[] = DEFAULT_HUMAN_HANDOFF_KEYWORDS
): boolean {
  const text = incomingText.trim().toLowerCase();
  if (!text) {
    return false;
  }
  for (const raw of keywords) {
    const needle = raw.trim().toLowerCase();
    if (!needle) {
      continue;
    }
    if (needle.length <= 2) {
      if (text === needle) {
        return true;
      }
      continue;
    }
    if (text === needle || text.includes(needle)) {
      return true;
    }
  }
  return false;
}
