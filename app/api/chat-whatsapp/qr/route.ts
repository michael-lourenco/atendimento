import { NextRequest } from 'next/server';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { getDashboardQrCode } from '@/infra/whatsapp/dashboardConnection';
import { isEvolutionProvider } from '@/infra/whatsapp/isEvolutionProvider';

export async function GET(request: NextRequest) {
  try {
    const instance = request.nextUrl.searchParams.get('instance');
    const qrData = await getDashboardQrCode(instance);
    return apiJson(request, qrData, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao obter QR Code', error);
    const hint = isEvolutionProvider()
      ? 'Verifique EVOLUTION_API_URL e se a instância da Evolution está no ar'
      : 'Verifique se CHAT_WHATSAPP_API_URL está configurado corretamente';

    return apiJson(
      request,
      {
        error: 'Erro ao obter QR Code',
        details: { hint },
      },
      { status: 500 }
    );
  }
}
