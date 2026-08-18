import 'server-only';

import { User } from '../../core/entities/User';
import { createCookieSupabase } from './cookieClient';
import { asDate } from './crud';

export async function getOperatorUser(): Promise<User | null> {
  const supabase = await createCookieSupabase();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  return {
    id: String(profile.id),
    email: String(profile.email),
    name: String(profile.name),
    role: profile.role === 'admin' ? 'admin' : 'user',
    createdAt: asDate(profile.created_at),
  };
}
