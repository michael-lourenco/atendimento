export function inboxHrefForConversation(conversationId: string): string {
  return `/dashboard/conversations?conversation=${encodeURIComponent(conversationId)}`;
}

export function inboxHrefForContactPhone(phone: string): string {
  return `/dashboard/conversations?contact=${encodeURIComponent(phone.trim())}`;
}

export function inboxHrefForContactThreads(
  phone: string,
  threads: { id: string }[]
): string {
  if (threads.length === 1) {
    return inboxHrefForConversation(threads[0].id);
  }
  return inboxHrefForContactPhone(phone);
}
