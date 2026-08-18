import { NextResponse } from 'next/server';
import { getDashboardQrCode } from '@/infra/whatsapp/dashboardConnection';
import { isEvolutionProvider } from '@/infra/whatsapp/isEvolutionProvider';

export async function GET() {
  try {
    const qrData = await getDashboardQrCode();
    return NextResponse.json(qrData, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const hint = isEvolutionProvider()
      ? 'Verifique EVOLUTION_API_URL, EVOLUTION_API_KEY e se o Docker da Evolution está no ar'
      : 'Verifique se CHAT_WHATSAPP_API_URL está configurado corretamente';

    return NextResponse.json(
      {
        error: 'Erro ao obter QR Code',
        message: errorMessage,
        details: { hint },
      },
      { status: 500 }
    );
  }
}
