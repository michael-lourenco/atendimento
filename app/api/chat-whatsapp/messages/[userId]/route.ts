import { NextRequest } from 'next/server';
import { ChatWhatsAppService } from '@/infra/whatsapp/ChatWhatsAppService';
import { isEvolutionProvider } from '@/infra/whatsapp/isEvolutionProvider';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId) {
      return apiJson(request, { error: 'userId é obrigatório' }, { status: 400 });
    }

    if (isEvolutionProvider()) {
      return apiJson(request, { messages: [], total: 0 }, { status: 200 });
    }

    const service = new ChatWhatsAppService();
    const messages = await service.getMessagesByUser(userId);
    return apiJson(request, messages, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao obter mensagens do usuário', error);
    return apiJson(request, { error: 'Erro ao obter mensagens do usuário' }, { status: 500 });
  }
}
