import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { hasCronBearer } from '@/infra/schedules/cronAuth';
import { runDispatchDueScheduledMessages } from '@/infra/schedules/runDispatchDueScheduledMessages';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function isAllowed(request: Request): Promise<boolean> {
  if (hasCronBearer(request.headers.get('authorization'))) {
    return true;
  }
  if (!isPublicSupabaseConfigured()) {
    return true;
  }
  return Boolean(await getOperatorUser());
}

async function handle(request: Request) {
  try {
    if (!(await isAllowed(request))) {
      return apiJson(request, { error: 'Não autenticado' }, { status: 401 });
    }
    const result = await runDispatchDueScheduledMessages();
    return apiJson(request, result, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao enviar agendamentos', error);
    return apiJson(request, { error: 'Erro ao enviar agendamentos' }, { status: 500 });
  }
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
