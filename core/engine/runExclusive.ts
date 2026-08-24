const tails = new Map<string, Promise<void>>();

export function runExclusive<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve();
  const next = previous.then(work, work);
  const done = next.then(
    () => undefined,
    () => undefined
  );
  tails.set(key, done);
  void done.then(() => {
    if (tails.get(key) === done) {
      tails.delete(key);
    }
  });
  return next;
}
