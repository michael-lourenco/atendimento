export async function postThreadMessage(input: {
  to: string;
  conversationId: string;
  text: string;
  file: File | null;
  quotedMessageId?: string;
}): Promise<void> {
  const response = input.file
    ? await fetch('/api/messages/send', {
        method: 'POST',
        body: (() => {
          const form = new FormData();
          form.append('to', input.to);
          form.append('conversationId', input.conversationId);
          form.append('message', input.text);
          form.append('file', input.file);
          if (input.quotedMessageId) {
            form.append('quotedMessageId', input.quotedMessageId);
          }
          return form;
        })(),
      })
    : await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: input.to,
          message: input.text,
          conversationId: input.conversationId,
          quotedMessageId: input.quotedMessageId,
        }),
      });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || 'Falha ao enviar');
  }
}
