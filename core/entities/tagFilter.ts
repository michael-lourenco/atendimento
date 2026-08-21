export type TagFilter = 'all' | string;

export function matchesTagFilter(tags: string[], tagFilter: TagFilter): boolean {
  if (tagFilter === 'all') {
    return true;
  }
  const needle = tagFilter.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return tags.some((tag) => tag.trim().toLowerCase() === needle);
}

export function uniqueTagNames(items: { tags: string[] }[]): string[] {
  const names = new Map<string, string>();
  for (const item of items) {
    for (const tag of item.tags) {
      const name = tag.trim();
      if (!name) {
        continue;
      }
      const key = name.toLowerCase();
      if (!names.has(key)) {
        names.set(key, name);
      }
    }
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
