import { WhatsAppWebhookEntry } from '../../core/services/IWhatsAppService';

export type MetaIncomingReaction = {
  targetId: string;
  from: string;
  emoji: string;
};

export function mapMetaReactions(entry: WhatsAppWebhookEntry): MetaIncomingReaction[] {
  const mapped: MetaIncomingReaction[] = [];
  for (const change of entry.changes ?? []) {
    for (const msg of change.value.messages ?? []) {
      if (msg.type !== 'reaction' || !msg.reaction?.message_id) {
        continue;
      }
      mapped.push({
        targetId: msg.reaction.message_id,
        from: msg.from,
        emoji: msg.reaction.emoji ?? '',
      });
    }
  }
  return mapped;
}
