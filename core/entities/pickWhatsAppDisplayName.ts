export function pickWhatsAppDisplayName(
  phone: string,
  ...names: Array<string | undefined | null>
): string {
  const digits = phone.replace(/\D/g, '') || phone;
  for (const name of names) {
    const trimmed = name?.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.replace(/\D/g, '') === digits) {
      continue;
    }
    return trimmed;
  }
  return digits;
}
