export type QuickReplyMediaKind = 'audio' | 'image' | 'video' | 'document';

export interface QuickReply {
  id: string;
  title: string;
  body: string;
  mediaKind?: QuickReplyMediaKind;
  departmentId?: string;
  createdAt: Date;
}

export function isQuickReplyMediaKind(value: unknown): value is QuickReplyMediaKind {
  return value === 'audio' || value === 'image' || value === 'video' || value === 'document';
}

export function sortQuickReplies(replies: QuickReply[]): QuickReply[] {
  return [...replies].sort((a, b) =>
    a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
  );
}

export function quickReplyHasMedia(reply: Pick<QuickReply, 'mediaKind'>): boolean {
  return isQuickReplyMediaKind(reply.mediaKind);
}

export function quickReplyMediaLabel(kind: QuickReplyMediaKind): string {
  if (kind === 'image') {
    return 'Foto';
  }
  if (kind === 'video') {
    return 'Vídeo';
  }
  if (kind === 'document') {
    return 'Documento';
  }
  return 'Áudio';
}

export function quickReplyListPreview(reply: QuickReply): string {
  if (quickReplyHasMedia(reply) && !reply.body.trim() && reply.mediaKind) {
    return quickReplyMediaLabel(reply.mediaKind);
  }
  return reply.body;
}

export function quickReplyPickerActionLabel(reply: Pick<QuickReply, 'mediaKind'>): string {
  if (reply.mediaKind === 'image') {
    return 'Envia imagem';
  }
  if (reply.mediaKind === 'video') {
    return 'Envia vídeo';
  }
  if (reply.mediaKind === 'audio') {
    return 'Envia áudio';
  }
  if (reply.mediaKind === 'document') {
    return 'Envia documento';
  }
  return 'Insere texto';
}

export function quickReplyIsValid(reply: Pick<QuickReply, 'title' | 'body' | 'mediaKind'>): boolean {
  if (!reply.title.trim()) {
    return false;
  }
  return Boolean(reply.body.trim() || quickReplyHasMedia(reply));
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
