export function isPublicSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return url.startsWith('http') && anon.length > 20;
}

export function isTestEnv(): boolean {
  return process.env.NODE_ENV === 'test';
}
