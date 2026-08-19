import { NextRequest } from 'next/server';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { HttpBodyError, parseJsonBody } from '@/infra/http/parseJson';
import { requestIdFrom } from '@/infra/http/requestId';
import { chatWhatsAppWebhookSchema } from '@/infra/http/schemas';

export async function POST(request: NextRequest) {
  try {
    await parseJsonBody(request, chatWhatsAppWebhookSchema);
    return apiJson(request, { status: 'ok', received: true }, { status: 200 });
  } catch (error) {
    if (error instanceof HttpBodyError) {
      return apiJson(request, { error: error.message }, { status: 400 });
    }
    logApiError(requestIdFrom(request), 'Erro ao processar webhook chat-whatsapp', error);
    return apiJson(request, { status: 'ok' }, { status: 200 });
  }
}
