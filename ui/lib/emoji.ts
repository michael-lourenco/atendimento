export type EmojiGroupId = 'smileys' | 'gestures' | 'objects' | 'symbols';

export type EmojiGroup = {
  id: EmojiGroupId;
  label: string;
  emojis: string[];
};

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'smileys',
    label: 'Sorrisos',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍',
      '🥰', '😘', '😋', '😜', '🤔', '😐', '😏', '😢', '😭', '😤', '😡', '🤯',
      '😴', '😷', '🤒', '🥳', '😎', '🤩',
    ],
  },
  {
    id: 'gestures',
    label: 'Gestos',
    emojis: [
      '👍', '👎', '👏', '🙌', '🙏', '👌', '✌️', '🤞', '🤝', '👋', '✋', '💪',
      '🫶', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💯', '🔥',
    ],
  },
  {
    id: 'objects',
    label: 'Objetos',
    emojis: [
      '📱', '💻', '📧', '📎', '📅', '📌', '📝', '📦', '🛒', '💳', '💰', '🏠',
      '🚗', '✈️', '⏰', '🔔', '🎉', '🎁', '☕', '🍕', '📷', '🎧', '📄', '🗂️',
    ],
  },
  {
    id: 'symbols',
    label: 'Símbolos',
    emojis: [
      '✅', '❌', '⚠️', '❗', '❓', '💡', '⭐', '🌟', '✨', '➡️', '⬅️', '⬆️',
      '⬇️', '➕', '➖', '✔️', '🔄', '🔗', '📍', '🟢', '🟡', '🔴', '⚪', '⚫',
    ],
  },
];

export function insertEmojiAtCursor(
  text: string,
  emoji: string,
  start: number,
  end: number
): { text: string; cursor: number } {
  const from = Math.max(0, Math.min(start, text.length));
  const to = Math.max(from, Math.min(end, text.length));
  const next = `${text.slice(0, from)}${emoji}${text.slice(to)}`;
  return { text: next, cursor: from + emoji.length };
}
