import { Conversation } from './Conversation';
import { Message } from './Message';
import { WhatsAppNumber } from './WhatsAppNumber';

export function slugWhatsAppInstanceName(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'default';
}

export function matchWhatsAppNumber(
  numbers: WhatsAppNumber[],
  hint: string | undefined
): WhatsAppNumber | undefined {
  const raw = hint?.trim() ?? '';
  if (!raw) {
    return undefined;
  }
  const needle = raw.toLowerCase();
  const digits = raw.replace(/\D/g, '');
  return (
    numbers.find((item) => item.instanceName?.trim().toLowerCase() === needle) ??
    numbers.find((item) => item.id === raw) ??
    (digits
      ? numbers.find((item) => item.number.replace(/\D/g, '') === digits)
      : undefined)
  );
}

export function lineHintFromMessage(message: Message): string {
  return message.direction === 'incoming' ? message.to : message.from;
}

export function defaultEvolutionInstanceName(): string {
  return process.env.EVOLUTION_INSTANCE_NAME?.trim() || 'default';
}

export function lineNameOf(
  numbers: WhatsAppNumber[],
  conversation: { whatsappNumberId?: string } | null | undefined
): string {
  const lineId = conversation?.whatsappNumberId?.trim();
  if (!lineId) {
    return '';
  }
  return numbers.find((item) => item.id === lineId)?.name?.trim() ?? '';
}

export function outgoingWhatsAppLine(
  conversation: Conversation | null | undefined,
  numbers: WhatsAppNumber[],
  fallbackInstance = defaultEvolutionInstanceName()
): { instanceName: string; number?: WhatsAppNumber } {
  const byId = conversation?.whatsappNumberId
    ? numbers.find((item) => item.id === conversation.whatsappNumberId)
    : undefined;
  const active = numbers.find((item) => item.status === 'active' && item.instanceName);
  const chosen = byId ?? active;
  return {
    instanceName: chosen?.instanceName?.trim() || fallbackInstance,
    number: chosen,
  };
}
