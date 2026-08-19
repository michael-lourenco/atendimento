import { Conversation } from './Conversation';
import { WhatsAppNumber } from './WhatsAppNumber';

export const AVATAR_BACKFILL_BATCH = 12;

export function conversationContactPhone(
  conversation: Pick<Conversation, 'contactId' | 'contactPhone'>
): string {
  const fromId = conversation.contactId.replace(/\D/g, '');
  if (fromId) {
    return fromId;
  }
  return conversation.contactPhone.replace(/\D/g, '') || conversation.contactPhone;
}

export type AvatarBackfillTarget = {
  phone: string;
  instanceName?: string;
  name?: string;
};

export function conversationsNeedingAvatarPhoto(
  conversations: Conversation[],
  numbers: WhatsAppNumber[]
): AvatarBackfillTarget[] {
  const seen = new Set<string>();
  const targets: AvatarBackfillTarget[] = [];
  for (const conversation of conversations) {
    if (conversation.contactAvatarUrl?.trim()) {
      continue;
    }
    const phone = conversationContactPhone(conversation);
    if (!phone || seen.has(phone)) {
      continue;
    }
    seen.add(phone);
    const line = numbers.find((item) => item.id === conversation.whatsappNumberId);
    targets.push({
      phone,
      instanceName: line?.instanceName,
      name: conversation.contactName,
    });
  }
  return targets;
}
