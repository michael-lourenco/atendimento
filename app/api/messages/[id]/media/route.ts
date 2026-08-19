import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { resolvePlayableMedia } from '@/infra/whatsapp/evolutionMedia';

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

    const message = await serverLocator.getRepos().message.getById(id);
    if (!message) {
      return apiJson(request, { error: 'Mensagem não encontrada' }, { status: 404 });
    }

    const whatsApp = serverLocator.getWhatsAppService();
    const file = await resolvePlayableMedia({
      message,
      storage: serverLocator.getMediaStorage(),
      download:
        whatsApp instanceof EvolutionWhatsAppService
          ? (input) => whatsApp.downloadMedia(input)
          : undefined,
    });

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
