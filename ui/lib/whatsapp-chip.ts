export type WhatsAppChipTone = 'ok' | 'down';

export type WhatsAppChipState = {
  tone: WhatsAppChipTone;
  label: string;
  compact: string;
};

export function connectedCatalogCount(
  instanceNames: Array<string | undefined>,
  instances: Array<{ name: string; connected: boolean }>
): number {
  return instanceNames.filter((name) => {
    const slug = name?.trim().toLowerCase();
    if (!slug) {
      return false;
    }
    return instances.some(
      (item) => item.connected && item.name.trim().toLowerCase() === slug
    );
  }).length;
}

export function whatsappChipState(input: {
  catalogCount: number;
  connectedCount: number;
  anyConnected: boolean;
}): WhatsAppChipState {
  const { catalogCount, connectedCount, anyConnected } = input;
  if (catalogCount <= 1) {
    return anyConnected
      ? { tone: 'ok', label: 'WhatsApp conectado', compact: 'On' }
      : { tone: 'down', label: 'WhatsApp desconectado', compact: 'Off' };
  }
  const allUp = connectedCount === catalogCount;
  return {
    tone: allUp ? 'ok' : 'down',
    label: `${connectedCount} de ${catalogCount} linhas`,
    compact: `${connectedCount}/${catalogCount}`,
  };
}
