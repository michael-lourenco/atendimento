export function catalogMatchesQuery(name: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return name.toLowerCase().includes(needle);
}
