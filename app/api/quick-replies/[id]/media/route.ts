import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { quickReplyHasAudio } from '@/core/entities/QuickReply';
import {
  InvalidQuickReplyMediaError,
  SaveQuickReplyMediaUseCase,
} from '@/core/usecases/SaveQuickReplyMediaUseCase';
import { MAX_OUTGOING_MEDIA_BYTES, quickReplyMediaPath } from '@/core/services/IMediaStorage';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

async function requireOperator(request: NextRequest) {
  if (!isPublicSupabaseConfigured()) {
    return null;
  }
  const operator = await getOperatorUser();
  if (!operator) {
    return apiJson(request, { error: 'Não autenticado' }, { status: 401 });
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireOperator(request);
    if (denied) {
      return denied;
    }
    const { id } = await params;
    if (!id) {
      return apiJson(request, { error: 'id é obrigatório' }, { status: 400 });
    }
    const reply = await serverLocator.getRepos().quickReply.getById(id);
    if (!reply || !quickReplyHasAudio(reply)) {
      return apiJson(request, { error: 'Áudio não encontrado' }, { status: 404 });
    }
    const file = await serverLocator.getMediaStorage().get(quickReplyMediaPath(id));
    if (!file) {
      return apiJson(request, { error: 'Áudio não encontrado' }, { status: 404 });
    }
    return applyRequestId(
      request,
      new NextResponse(Buffer.from(file.bytes), {
        status: 200,
        headers: {
          'Content-Type': file.mimeType,
          'Cache-Control': 'private, no-cache',
        },
      })
    );
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao obter áudio da resposta rápida', error);
    return apiJson(request, { error: 'Erro ao obter áudio' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireOperator(request);
    if (denied) {
      return denied;
    }
    const { id } = await params;
    if (!id) {
      return apiJson(request, { error: 'id é obrigatório' }, { status: 400 });
    }
    const form = await request.formData();
    const uploaded = form.get('file');
    if (!(uploaded instanceof File) || uploaded.size === 0) {
      return apiJson(request, { error: 'Campo obrigatório: file' }, { status: 400 });
    }
    if (uploaded.size > MAX_OUTGOING_MEDIA_BYTES) {
      return apiJson(request, { error: 'Arquivo maior que 16 MB' }, { status: 400 });
    }
    const updated = await new SaveQuickReplyMediaUseCase(
      serverLocator.getRepos().quickReply,
      serverLocator.getMediaStorage()
    ).execute(id, {
      bytes: new Uint8Array(await uploaded.arrayBuffer()),
      mimeType: uploaded.type || 'audio/ogg',
    });
    if (!updated) {
      return apiJson(request, { error: 'Resposta não encontrada' }, { status: 404 });
    }
    return apiJson(request, updated, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidQuickReplyMediaError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao gravar áudio da resposta rápida', error);
    return apiJson(request, { error: 'Erro ao gravar áudio' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireOperator(request);
    if (denied) {
      return denied;
    }
    const { id } = await params;
    if (!id) {
      return apiJson(request, { error: 'id é obrigatório' }, { status: 400 });
    }
    const updated = await new SaveQuickReplyMediaUseCase(
      serverLocator.getRepos().quickReply,
      serverLocator.getMediaStorage()
    ).execute(id, null);
    if (!updated) {
      return apiJson(request, { error: 'Resposta não encontrada' }, { status: 404 });
    }
    return apiJson(request, updated, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao remover áudio da resposta rápida', error);
    return apiJson(request, { error: 'Erro ao remover áudio' }, { status: 500 });
  }
}
