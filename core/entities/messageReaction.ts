import { Message, MessageReaction } from './Message';

export const QUICK_MESSAGE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

export function applyMessageReaction(
  reactions: MessageReaction[] | undefined,
  from: string,
  emoji: string
): MessageReaction[] {
  const who = from.trim();
  const mark = emoji.trim();
  const rest = (reactions ?? []).filter((item) => item.from !== who);
  if (!who || !mark) {
    return rest;
  }
  return [...rest, { emoji: mark, from: who }];
}

export function reactionTogglesOff(
  reactions: MessageReaction[] | undefined,
  from: string,
  emoji: string
): boolean {
  const who = from.trim();
  const mark = emoji.trim();
  if (!who || !mark) {
    return false;
  }
  return (reactions ?? []).some((item) => item.from === who && item.emoji === mark);
}

export function groupMessageReactions(
  reactions: MessageReaction[] | undefined,
  mineFrom: string
): { emoji: string; count: number; mine: boolean }[] {
  const grouped = new Map<string, { count: number; mine: boolean }>();
  for (const item of reactions ?? []) {
    const prev = grouped.get(item.emoji) ?? { count: 0, mine: false };
    prev.count += 1;
    if (item.from === mineFrom) {
      prev.mine = true;
    }
    grouped.set(item.emoji, prev);
  }
  return [...grouped.entries()].map(([emoji, value]) => ({ emoji, ...value }));
}

export function reactionSenderOf(message: { direction: string; from: string; to: string }): string {
  return message.direction === 'outgoing' ? message.from : message.to;
}

export function reactionPeerOf(message: { direction: string; from: string; to: string }): string {
  return message.direction === 'outgoing' ? message.to : message.from;
}

export function reactionsFromUnknown(value: unknown): MessageReaction[] | undefined {
  const raw =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const row = item as Record<string, unknown>;
      const emoji = String(row.emoji ?? '').trim();
      const from = String(row.from ?? '').trim();
      if (!from) {
        return null;
      }
      return { emoji, from };
    })
    .filter((item): item is MessageReaction => item != null);
}

export function coalesceMessageReactions(loaded: Message, previous?: Message): Message {
  if (Array.isArray(loaded.reactions)) {
    return loaded;
  }
  if (previous?.reactions) {
    return { ...loaded, reactions: previous.reactions };
  }
  return loaded;
}

export function coalesceMessageList(loaded: Message[], previous: Message[]): Message[] {
  const prev = new Map(previous.map((item) => [item.id, item]));
  return loaded.map((item) => coalesceMessageReactions(item, prev.get(item.id)));
}

export function nextMessageReactions(
  message: { reactions?: MessageReaction[]; direction: string; from: string; to: string },
  emoji: string
): MessageReaction[] {
  const from = reactionSenderOf(message);
  const mark = reactionTogglesOff(message.reactions, from, emoji) ? '' : emoji.trim();
  return applyMessageReaction(message.reactions, from, mark);
}
