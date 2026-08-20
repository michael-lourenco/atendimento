export function othersToDeactivate<T extends { id: string; isActive: boolean }>(
  catalog: T[],
  saving: T
): T[] {
  if (!saving.isActive) {
    return [];
  }
  return catalog.filter((item) => item.id !== saving.id && item.isActive);
}

export function companyChatbot<T extends { isActive: boolean }>(bots: T[]): T | null {
  return bots.find((item) => item.isActive) ?? bots[0] ?? null;
}

export function extraChatbots<T extends { id: string; isActive: boolean }>(bots: T[]): T[] {
  const main = companyChatbot(bots);
  if (!main) {
    return [];
  }
  return bots.filter((item) => item.id !== main.id);
}

export function companyChatbotFlowId(
  bots: { isActive: boolean; flowId?: string }[] | null | undefined
): string | undefined {
  const flowId = companyChatbot(bots ?? [])?.flowId?.trim();
  return flowId || undefined;
}
