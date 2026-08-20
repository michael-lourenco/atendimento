import { NextRequest } from 'next/server';
import { LogoutUseCase } from '@/core/usecases/LogoutUseCase';
import { apiJson } from '@/infra/http/apiJson';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export async function POST(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return apiJson(request, { status: 'ok' });
  }
  await new LogoutUseCase(serverLocator.getRepos().auth).execute();
  return apiJson(request, { status: 'ok' });
}
