import { NextResponse } from 'next/server';
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
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const result = await runDispatchDueScheduledMessages();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro ao enviar agendamentos',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
