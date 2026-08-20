import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { SendWhatsAppPresenceUseCase } from '@/core/usecases/SendWhatsAppPresenceUseCase';
import { outgoingWhatsAppLine } from '@/core/entities/whatsappNumberLine';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { presenceBodySchema } from '@/infra/http/schemas';
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

    const body = await parseJsonBody(request, presenceBodySchema);
    const repos = serverLocator.getRepos();
    let instanceName: string | undefined;
    if (body.conversationId) {
      const conversation = await repos.conversation.getById(body.conversationId);
      const catalog = await repos.whatsAppNumber.getAll();
      instanceName = outgoingWhatsAppLine(conversation, catalog).instanceName;
    }
    await new SendWhatsAppPresenceUseCase(serverLocator.getWhatsAppService()).execute({
      to: body.to,
      presence: body.presence,
      instanceName,
    });
    return applyRequestId(request, new NextResponse(null, { status: 204 }));
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao enviar presence', error);
    return apiJson(request, { error: 'Erro ao enviar presence' }, { status: 500 });
  }
}
