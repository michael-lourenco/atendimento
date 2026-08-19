export async function syncInboxAvatars(): Promise<boolean> {
  const response = await fetch('/api/contacts/avatars/sync', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    return false;
  }
  const body = (await response.json().catch(() => ({}))) as { filled?: number };
  return Boolean(body.filled);
}
