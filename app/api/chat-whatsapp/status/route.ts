import { NextRequest } from 'next/server';
import { SyncLiveWhatsAppNumberUseCase } from '@/core/usecases/SyncLiveWhatsAppNumberUseCase';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { apiJson } from '@/infra/http/apiJson';
import { logApiError } from '@/infra/http/apiLog';
import { requestIdFrom } from '@/infra/http/requestId';
import { getDashboardWhatsAppStatus } from '@/infra/whatsapp/dashboardConnection';

export async function GET(request: NextRequest) {
  try {
    const instance = request.nextUrl.searchParams.get('instance');
    const status = await getDashboardWhatsAppStatus(instance);
    const sync = new SyncLiveWhatsAppNumberUseCase(serverLocator.getRepos().whatsAppNumber);
    try {
      if (status.instances && status.instances.length > 0) {
        for (const item of status.instances) {
          await sync.execute({
            connected: item.connected,
            wid: item.info?.wid ?? null,
            pushname: item.info?.pushname ?? null,
            platform: item.info?.platform ?? null,
            instanceName: item.name,
          });
        }
      } else {
        await sync.execute({
          connected: status.connected,
          wid: status.info?.wid ?? null,
          pushname: status.info?.pushname ?? null,
          platform: status.info?.platform ?? null,
          instanceName: instance,
        });
      }
    } catch {
      // catálogo não pode esconder o status da conexão
    }
    return apiJson(request, status, { status: 200 });
  } catch (error) {
    logApiError(requestIdFrom(request), 'Erro ao obter status', error);
    return apiJson(request, { error: 'Erro ao obter status' }, { status: 500 });
  }
}
