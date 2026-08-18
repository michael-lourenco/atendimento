import { NextResponse } from 'next/server';
import { getDashboardWhatsAppStatus } from '@/infra/whatsapp/dashboardConnection';

export async function GET() {
  try {
    const status = await getDashboardWhatsAppStatus();
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
