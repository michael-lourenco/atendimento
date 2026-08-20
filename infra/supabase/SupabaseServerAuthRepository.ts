import 'server-only';

import { AuthUser, User } from '../../core/entities/User';
import { CreateOperatorInput, IAuthRepository } from '../../core/repositories/IAuthRepository';
import { createCookieSupabase } from './cookieClient';
import { getOperatorUser } from './getOperatorUser';
import { userFromProfileRow } from './profileUser';
import { createServiceRoleClient } from './serviceRoleClient';

export class SupabaseServerAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<AuthUser | null> {
    const supabase = await createCookieSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return null;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    const user = userFromProfileRow(
      (profile ?? {
        id: data.user.id,
        email: data.user.email,
        name: '',
        role: 'user',
        created_at: new Date().toISOString(),
      }) as Record<string, unknown>
    );
    return { ...user, token: undefined };
  }

  async logout(): Promise<void> {
    const supabase = await createCookieSupabase();
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    return getOperatorUser();
  }

  async isAuthenticated(): Promise<boolean> {
    return (await this.getCurrentUser()) !== null;
  }

  async listOperators(): Promise<User[]> {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.from('profiles').select('*').order('created_at');
    if (error) {
      throw error;
    }
    return (data ?? []).map((row) => userFromProfileRow(row as Record<string, unknown>));
  }

  async createOperator(input: CreateOperatorInput): Promise<User | null> {
    const admin = createServiceRoleClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name },
    });
    if (error || !data.user) {
      if (error?.message?.toLowerCase().includes('already')) {
        return null;
      }
      throw error ?? new Error('Não foi possível criar');
    }
    if (input.role === 'admin') {
      await admin.from('profiles').update({ role: 'admin', name: input.name }).eq('id', data.user.id);
    } else {
      await admin.from('profiles').update({ name: input.name }).eq('id', data.user.id);
    }
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    return userFromProfileRow(
      (profile ?? {
        id: data.user.id,
        email: input.email,
        name: input.name,
        role: input.role,
        created_at: new Date().toISOString(),
      }) as Record<string, unknown>
    );
  }

  async setOperatorRole(id: string, role: 'admin' | 'user'): Promise<boolean> {
    const admin = createServiceRoleClient();
    const { data } = await admin.from('profiles').select('id').eq('id', id).maybeSingle();
    if (!data) {
      return false;
    }
    const { error } = await admin.from('profiles').update({ role }).eq('id', id);
    if (error) {
      throw error;
    }
    return true;
  }

  async setOperatorPassword(id: string, password: string): Promise<boolean> {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) {
      return false;
    }
    return true;
  }

  async deleteOperator(id: string): Promise<boolean> {
    const admin = createServiceRoleClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return false;
    }
    return true;
  }
}
