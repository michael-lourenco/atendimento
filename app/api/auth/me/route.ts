import { NextRequest } from 'next/server';
import { apiJson } from '@/infra/http/apiJson';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

export async function GET(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { error: 'unauthenticated' }, { status: 401 });
  }
  const user = await getOperatorUser();
  if (!user) {
    return apiJson(request, { error: 'unauthenticated' }, { status: 401 });
  }
  return apiJson(request, user);
}
