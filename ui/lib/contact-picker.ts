import { Contact } from '@/core/entities/Contact';

const PICKER_LIMIT = 30;

export function digitsFromPhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function normalizeSchedulePhone(raw: string): string {
  const digits = digitsFromPhone(raw);
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function contactPhoneOf(contact: { id: string; phone: string }): string {
  return normalizeSchedulePhone(contact.phone) || digitsFromPhone(contact.phone) || contact.phone || contact.id;
}

export function findContactByPhone(contacts: Contact[], phone: string): Contact | undefined {
  const digits = normalizeSchedulePhone(phone) || digitsFromPhone(phone);
  if (!digits) return undefined;
  return contacts.find((contact) => {
    const byPhone = digitsFromPhone(contact.phone);
    const byId = digitsFromPhone(contact.id);
    return byPhone === digits || byId === digits || contact.phone === phone || contact.id === phone;
  });
}

export function contactPickerLabel(contact: { name: string; phone: string }): string {
  const name = contact.name.trim();
  if (!name || name === contact.phone) {
    return contact.phone;
  }
  return `${name} · ${contact.phone}`;
}

export function filterContactsForPicker(contacts: Contact[], query: string): Contact[] {
  const sorted = [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const term = query.trim().toLowerCase();
  const digits = digitsFromPhone(query);
  const matched = term
    ? sorted.filter((contact) => {
        return (
          contact.name.toLowerCase().includes(term) ||
          contact.phone.toLowerCase().includes(term) ||
          (digits.length > 0 && digitsFromPhone(contact.phone).includes(digits))
        );
      })
    : sorted;
  return matched.slice(0, PICKER_LIMIT);
}

export function newContactPhoneFromQuery(query: string, contacts: Contact[]): string | null {
  const digits = normalizeSchedulePhone(query);
  if (digits.length < 10) return null;
  if (findContactByPhone(contacts, digits)) return null;
  return digits;
}
