import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';
import { GetMessageMediaUseCase } from '@/core/usecases/GetMessageMediaUseCase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (isPublicSupabaseConfigured()) {
      const operator = await getOperatorUser();
      if (!operator) {
        return apiJson(request, { error: 'Não autenticado' }, { status: 401 });
      }
    }

    const { id } = await params;
    if (!id) {
      return apiJson(request, { error: 'id é obrigatório' }, { status: 400 });
    }

    const file = await new GetMessageMediaUseCase(
      serverLocator.getRepos().message,
      serverLocator.getMediaStorage(),
      serverLocator.getWhatsAppService()
    ).execute(id);

    if (!file) {
      return apiJson(request, { error: 'Mídia indisponível' }, { status: 404 });
    }

    return applyRequestId(
      request,
      new NextResponse(Buffer.from(file.bytes), {
        status: 200,
        headers: {
          'Content-Type': file.mimeType,
          'Cache-Control': 'private, max-age=3600',
        },
      })
    );
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao obter mídia da mensagem', error);
    return apiJson(request, { error: 'Erro ao obter mídia' }, { status: 500 });
  }
}
