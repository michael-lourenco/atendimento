import { Conversation } from '@/core/entities/Conversation';

export const INBOX_CHIME_BOOST_KEY = 'inbox-chime-boost-date';
export const INBOX_CHIME_MUTE_KEY = 'inbox-chime-muted';

export function shouldBoostInboxChime(today: string, stored: string | null): boolean {
  return stored !== today;
}

export function isInboxChimeMuted(stored: string | null): boolean {
  return stored === '1';
}

export function shouldPlayInboxSound(
  previous: Conversation[] | null,
  next: Conversation[]
): boolean {
  if (!previous) {
    return false;
  }
  const previousUnread = previous.reduce((sum, item) => sum + item.unreadCount, 0);
  const nextUnread = next.reduce((sum, item) => sum + item.unreadCount, 0);
  if (nextUnread > previousUnread) {
    return true;
  }
  const known = new Set(previous.map((item) => item.id));
  return next.some((item) => !known.has(item.id));
}

export function inboxUnreadTotal(conversations: Conversation[]): number {
  return conversations.reduce((sum, item) => sum + item.unreadCount, 0);
}

export function inboxDocumentTitle(unread: number, base = 'Conversas'): string {
  if (unread <= 0) {
    return base;
  }
  return `(${unread}) ${base}`;
}

export function playInboxChime(now = new Date()): void {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return;
  }
  try {
    if (isInboxChimeMuted(window.localStorage.getItem(INBOX_CHIME_MUTE_KEY))) {
      return;
    }
    const today = now.toISOString().slice(0, 10);
    let boost = false;
    try {
      boost = shouldBoostInboxChime(today, window.localStorage.getItem(INBOX_CHIME_BOOST_KEY));
      if (boost) {
        window.localStorage.setItem(INBOX_CHIME_BOOST_KEY, today);
      }
    } catch {
      boost = false;
    }
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = boost ? 660 : 880;
    gain.gain.value = boost ? 0.12 : 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (boost ? 0.28 : 0.12));
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    return;
  }
}
