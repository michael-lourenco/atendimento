export function notifyWhatsAppRead(conversationId: string): void {
  void fetch('/api/messages/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId }),
  }).catch(() => {
    // visto no WhatsApp não pode esconder o chat
  });
}
