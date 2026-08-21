export function whatsappConnectHref(instanceName?: string): string {
  const name = instanceName?.trim();
  if (!name) {
    return '/dashboard/whatsapp';
  }
  return `/dashboard/whatsapp?instance=${encodeURIComponent(name)}`;
}

export const NUMBERS_CATALOG_HREF = '/dashboard/numbers';
