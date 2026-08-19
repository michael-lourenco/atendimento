import { NextRequest } from 'next/server';
import { ChatWhatsAppService } from '@/infra/whatsapp/ChatWhatsAppService';
import { getDashboardWhatsAppMessages } from '@/infra/whatsapp/dashboardConnection';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const messages = await getDashboardWhatsAppMessages(limit, offset);
    return apiJson(request, messages, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao obter mensagens', error);
    return apiJson(request, { error: 'Erro ao obter mensagens' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { to?: string; message?: string };
    const to = typeof body.to === 'string' ? body.to : '';
    const message = typeof body.message === 'string' ? body.message : '';
    if (!to || !message) {
      return apiJson(request, { error: 'Campos obrigatórios: to, message' }, { status: 400 });
    }
    const service = new ChatWhatsAppService();
    const result = await service.sendMessage(to, message);
    return apiJson(request, result, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao enviar mensagem', error);
    return apiJson(request, { error: 'Erro ao enviar mensagem' }, { status: 500 });
  }
}
