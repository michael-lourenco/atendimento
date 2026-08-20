export function tokenizeKeywordDraft(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function keywordKey(value: string): string {
  return value.trim().toLowerCase();
}

export function addFlowKeywords(current: string[], incoming: string): string[] {
  const next = [...current];
  const seen = new Set(next.map(keywordKey));
  for (const token of tokenizeKeywordDraft(incoming)) {
    const key = keywordKey(token);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    next.push(token.trim());
  }
  if (next.length === current.length) {
    return current;
  }
  return next;
}

export function normalizeFlowKeywords(values: string[]): string[] {
  return addFlowKeywords([], values.join('\n'));
}

export function removeFlowKeyword(current: string[], index: number): string[] {
  if (index < 0 || index >= current.length) {
    return current;
  }
  return current.filter((_, itemIndex) => itemIndex !== index);
}

export function popFlowKeyword(current: string[]): string[] {
  if (current.length === 0) {
    return current;
  }
  return current.slice(0, -1);
}
