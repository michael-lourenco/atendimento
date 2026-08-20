export interface QuickReply {
  id: string;
  title: string;
  body: string;
  mediaKind?: 'audio';
  departmentId?: string;
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

export function quickReplyPickerActionLabel(reply: Pick<QuickReply, 'mediaKind'>): string {
  return quickReplyHasAudio(reply) ? 'Envia áudio' : 'Insere texto';
}

export function quickReplyIsValid(reply: Pick<QuickReply, 'title' | 'body' | 'mediaKind'>): boolean {
  if (!reply.title.trim()) {
    return false;
  }
  return Boolean(reply.body.trim() || quickReplyHasAudio(reply));
}

export function quickReplyMatchesQuery(reply: QuickReply, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('pt-BR');
  if (!needle) {
    return true;
  }
  const haystack = `${reply.title} ${reply.body}`.toLocaleLowerCase('pt-BR');
  return haystack.includes(needle);
}

export function quickRepliesMatchingQuery(replies: QuickReply[], query: string): QuickReply[] {
  return replies.filter((item) => quickReplyMatchesQuery(item, query));
}

export function quickReplyVisibleInConversation(
  reply: Pick<QuickReply, 'departmentId'>,
  conversationDepartmentId?: string
): boolean {
  if (!reply.departmentId) {
    return true;
  }
  return reply.departmentId === conversationDepartmentId;
}

export function quickRepliesForConversation(
  replies: QuickReply[],
  conversationDepartmentId?: string
): QuickReply[] {
  return replies.filter((item) =>
    quickReplyVisibleInConversation(item, conversationDepartmentId)
  );
}
