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

export function resolveEntryFlowId(input: {
  bots: { isActive: boolean; flowId?: string }[] | null | undefined;
  lineFlowId?: string | null;
}): string | undefined {
  const lineFlowId = input.lineFlowId?.trim();
  if (lineFlowId) {
    return lineFlowId;
  }
  return companyChatbotFlowId(input.bots);
}

export function whatsappEntryFlowIds(
  bots: { isActive: boolean; flowId?: string }[],
  lines: { flowId?: string }[],
  fallbackId?: string
): string[] {
  const ids = new Set<string>();
  const company = companyChatbotFlowId(bots) ?? fallbackId;
  const inherits = lines.length === 0 || lines.some((item) => !item.flowId?.trim());
  if (inherits && company) {
    ids.add(company);
  }
  for (const line of lines) {
    const id = line.flowId?.trim();
    if (id) {
      ids.add(id);
    }
  }
  return [...ids];
}
