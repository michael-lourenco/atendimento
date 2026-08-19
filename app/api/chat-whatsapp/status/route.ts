import { NextResponse } from 'next/server';
import { SyncLiveWhatsAppNumberUseCase } from '@/core/usecases/SyncLiveWhatsAppNumberUseCase';
import { serverLocator } from '@/infra/adapters/serverLocator';
import { getDashboardWhatsAppStatus } from '@/infra/whatsapp/dashboardConnection';

export async function GET() {
  try {
    const status = await getDashboardWhatsAppStatus();
    try {
      await new SyncLiveWhatsAppNumberUseCase(serverLocator.getRepos().whatsAppNumber).execute({
        connected: status.connected,
        wid: status.info?.wid ?? null,
        pushname: status.info?.pushname ?? null,
        platform: status.info?.platform ?? null,
      });
    } catch {
      // catálogo não pode esconder o status da conexão
    }
    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro ao obter status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
