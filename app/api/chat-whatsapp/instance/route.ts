import { NextRequest } from 'next/server';
import { slugWhatsAppInstanceName } from '@/core/entities/whatsappNumberLine';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { ensureInstanceBodySchema } from '@/infra/http/schemas';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';
import { requireAdminUser } from '@/infra/supabase/requireAdmin';
import { ensureEvolutionInstance } from '@/infra/whatsapp/evolutionConnection';
import { isEvolutionProvider } from '@/infra/whatsapp/isEvolutionProvider';

export async function POST(request: NextRequest) {
  try {
    if (isPublicSupabaseConfigured()) {
      const gate = await requireAdminUser(request);
      if ('response' in gate) {
        return gate.response;
      }
    }
    if (!isEvolutionProvider()) {
      return apiJson(request, { error: 'Só Evolution cria instância por linha' }, { status: 400 });
    }
    const body = await parseJsonBody(request, ensureInstanceBodySchema);
    const instanceName = slugWhatsAppInstanceName(body.instanceName);
    await ensureEvolutionInstance(instanceName);
    return apiJson(request, { ok: true, instanceName }, { status: 201 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao criar instância WhatsApp', error);
    return apiJson(request, { error: 'Erro ao criar instância' }, { status: 500 });
  }
}
