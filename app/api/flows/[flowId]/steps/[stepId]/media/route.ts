import { NextRequest, NextResponse } from 'next/server';
import { serverLocator } from '@/infra/adapters/serverLocator';
import {
  InvalidFlowStepMediaError,
  SaveFlowStepMediaUseCase,
} from '@/core/usecases/SaveFlowStepMediaUseCase';
import { GetFlowStepMediaUseCase } from '@/core/usecases/GetFlowStepMediaUseCase';
import { MAX_OUTGOING_MEDIA_BYTES } from '@/core/services/IMediaStorage';
import { apiJson, applyRequestId } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { getOperatorUser } from '@/infra/supabase/getOperatorUser';

type RouteParams = { params: Promise<{ flowId: string; stepId: string }> };

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

function idsFrom(params: { flowId?: string; stepId?: string }) {
  const flowId = params.flowId?.trim() ?? '';
  const stepId = params.stepId?.trim() ?? '';
  return { flowId, stepId };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireOperator(request);
    if (denied) {
      return denied;
    }
    const { flowId, stepId } = idsFrom(await params);
    if (!flowId || !stepId) {
      return apiJson(request, { error: 'flowId e stepId são obrigatórios' }, { status: 400 });
    }
    const file = await new GetFlowStepMediaUseCase(
      serverLocator.getRepos().flow,
      serverLocator.getMediaStorage()
    ).execute(flowId, stepId);
    if (!file) {
      return apiJson(request, { error: 'Mídia não encontrada' }, { status: 404 });
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
    logApiError(requestIdFrom(request), 'Erro ao obter mídia do passo', error);
    return apiJson(request, { error: 'Erro ao obter mídia' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireOperator(request);
    if (denied) {
      return denied;
    }
    const { flowId, stepId } = idsFrom(await params);
    if (!flowId || !stepId) {
      return apiJson(request, { error: 'flowId e stepId são obrigatórios' }, { status: 400 });
    }
    const form = await request.formData();
    const uploaded = form.get('file');
    if (!(uploaded instanceof File) || uploaded.size === 0) {
      return apiJson(request, { error: 'Campo obrigatório: file' }, { status: 400 });
    }
    if (uploaded.size > MAX_OUTGOING_MEDIA_BYTES) {
      return apiJson(request, { error: 'Arquivo maior que 16 MB' }, { status: 400 });
    }
    const updated = await new SaveFlowStepMediaUseCase(
      serverLocator.getRepos().flow,
      serverLocator.getMediaStorage()
    ).execute(flowId, stepId, {
      bytes: new Uint8Array(await uploaded.arrayBuffer()),
      mimeType:
        uploaded.type ||
        (uploaded.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
    });
    if (!updated) {
      return apiJson(request, { error: 'Fluxo ou passo não encontrado' }, { status: 404 });
    }
    return apiJson(request, updated, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidFlowStepMediaError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao gravar mídia do passo', error);
    return apiJson(request, { error: 'Erro ao gravar mídia' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const denied = await requireOperator(request);
    if (denied) {
      return denied;
    }
    const { flowId, stepId } = idsFrom(await params);
    if (!flowId || !stepId) {
      return apiJson(request, { error: 'flowId e stepId são obrigatórios' }, { status: 400 });
    }
    const updated = await new SaveFlowStepMediaUseCase(
      serverLocator.getRepos().flow,
      serverLocator.getMediaStorage()
    ).execute(flowId, stepId, null);
    if (!updated) {
      return apiJson(request, { error: 'Fluxo ou passo não encontrado' }, { status: 404 });
    }
    return apiJson(request, updated, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao remover mídia do passo', error);
    return apiJson(request, { error: 'Erro ao remover mídia' }, { status: 500 });
  }
}
