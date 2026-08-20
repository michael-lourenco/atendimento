export type ComposerPresence = 'composing' | 'recording' | 'paused';

export function postComposerPresence(
  to: string | undefined,
  conversationId: string | undefined,
  presence: ComposerPresence
): void {
  if (!to) {
    return;
  }
  void fetch('/api/messages/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, presence, conversationId }),
  });
}
