export type HighlightPart = { text: string; match: boolean };

export function highlightQueryMatches(content: string, query: string): HighlightPart[] {
  const needle = query.trim();
  if (!needle) {
    return [{ text: content, match: false }];
  }
  const source = content.toLowerCase();
  const look = needle.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;
  let found = source.indexOf(look, cursor);
  while (found >= 0) {
    if (found > cursor) {
      parts.push({ text: content.slice(cursor, found), match: false });
    }
    parts.push({ text: content.slice(found, found + look.length), match: true });
    cursor = found + look.length;
    found = source.indexOf(look, cursor);
  }
  if (cursor < content.length) {
    parts.push({ text: content.slice(cursor), match: false });
  }
  return parts.length > 0 ? parts : [{ text: content, match: false }];
}
