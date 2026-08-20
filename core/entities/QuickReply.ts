export interface QuickReply {
  id: string;
  title: string;
  body: string;
  mediaKind?: 'audio';
  createdAt: Date;
}

export function sortQuickReplies(replies: QuickReply[]): QuickReply[] {
  return [...replies].sort((a, b) =>
    a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
  );
}

export function quickReplyHasAudio(reply: Pick<QuickReply, 'mediaKind'>): boolean {
  return reply.mediaKind === 'audio';
}

export function quickReplyListPreview(reply: QuickReply): string {
  if (quickReplyHasAudio(reply) && !reply.body.trim()) {
    return 'Áudio';
  }
  return reply.body;
}

export function quickReplyIsValid(reply: Pick<QuickReply, 'title' | 'body' | 'mediaKind'>): boolean {
  if (!reply.title.trim()) {
    return false;
  }
  return Boolean(reply.body.trim() || quickReplyHasAudio(reply));
}
