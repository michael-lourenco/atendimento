import { Conversation } from '@/core/entities/Conversation';

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
  const known = new Set(previous.map((item) => item.contactPhone));
  return next.some((item) => !known.has(item.contactPhone));
}

export function playInboxChime(): void {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return;
  }
  try {
    const context = new window.AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.05;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => {
      void context.close();
    };
  } catch {
    return;
  }
}
