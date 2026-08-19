import { ZodType } from 'zod';

export class HttpBodyError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
  }
}

export async function parseJsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpBodyError('JSON inválido');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpBodyError(parsed.error.issues[0]?.message ?? 'Body inválido');
  }
  return parsed.data;
}
