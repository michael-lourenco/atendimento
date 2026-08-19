import { NextRequest } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

export async function POST(request: NextRequest) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return apiJson(request, { error: 'Não autenticado' }, { status: 401 });
      }
    }

    const result = await serverLocator.createMissingAvatarSync().execute();
    return apiJson(request, result);
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao recalcular fotos de contato', error);
    return apiJson(request, { error: 'Erro ao recalcular fotos' }, { status: 500 });
  }
}
