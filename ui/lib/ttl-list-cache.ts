export function createListCache<T>(ttlMs: number) {
  let cached: { at: number; rows: T[] } | null = null;
  let inflight: Promise<T[]> | null = null;

  return {
    invalidate() {
      cached = null;
    },
    list(fetchRows: () => Promise<T[]>): Promise<T[]> {
      if (cached && Date.now() - cached.at < ttlMs) {
        return Promise.resolve(cached.rows);
      }
      if (inflight) {
        return inflight;
      }
      inflight = fetchRows()
        .then((rows) => {
          cached = { at: Date.now(), rows };
          return rows;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
  };
}
