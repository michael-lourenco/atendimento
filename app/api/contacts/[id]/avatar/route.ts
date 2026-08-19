import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { contactAvatarPath } from '@/core/services/IMediaStorage';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

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

    const file = await serverLocator.getMediaStorage().get(contactAvatarPath(id));
    if (!file) {
      return apiJson(request, { error: 'Foto indisponível' }, { status: 404 });
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
    logApiError(requestIdFrom(request), 'Erro ao obter foto do contato', error);
    return apiJson(request, { error: 'Erro ao obter foto' }, { status: 500 });
  }
}
