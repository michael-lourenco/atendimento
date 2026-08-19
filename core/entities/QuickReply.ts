export interface QuickReply {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
}

export function sortQuickReplies(replies: QuickReply[]): QuickReply[] {
  return [...replies].sort((a, b) =>
    a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' })
  );
}
