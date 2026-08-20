import 'server-only';

import { User } from '../../core/entities/User';
import { createCookieSupabase } from './cookieClient';
import { userFromProfileRow } from './profileUser';

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

  return userFromProfileRow(profile as Record<string, unknown>);
}
