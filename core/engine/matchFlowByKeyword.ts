import { Flow } from '../entities/Flow';

function keywordHits(keyword: string, incoming: string): boolean {
  const needle = keyword.trim().toLowerCase();
  const text = incoming.trim().toLowerCase();
  if (!needle || !text) {
    return false;
  }
  return text === needle || text.includes(needle);
}

export function matchFlowByKeyword(
  flows: Flow[],
  incomingText: string,
  currentFlowId?: string
): Flow | null {
  const ranked: { flow: Flow; keyword: string }[] = [];
  for (const flow of flows) {
    if (!flow.isActive || flow.id === currentFlowId) {
      continue;
    }
    for (const keyword of flow.keywords ?? []) {
      if (keywordHits(keyword, incomingText)) {
        ranked.push({ flow, keyword: keyword.trim() });
      }
    }
  }
  ranked.sort((a, b) => b.keyword.length - a.keyword.length);
  return ranked[0]?.flow ?? null;
}
