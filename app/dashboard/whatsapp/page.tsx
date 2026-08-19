'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type QRCodeData = {
  qr: string | null;
  available: boolean;
  connected: boolean;
};

type StatusData = {
  connected: boolean;
  qrAvailable: boolean;
  info: {
    wid: string | null;
    pushname: string | null;
    platform: string | null;
  } | null;
};

export default function WhatsAppPage() {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [qrResponse, statusResponse] = await Promise.all([
        fetch('/api/chat-whatsapp/qr'),
        fetch('/api/chat-whatsapp/status'),
      ]);
      if (qrResponse.ok) {
        setQrData(await qrResponse.json());
      }
      if (statusResponse.ok) {
        setStatus(await statusResponse.json());
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
    const timer = setInterval(() => {
      if (!status?.connected) {
        void loadData();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [status?.connected]);

  const isConnected = Boolean(status?.connected);
  const hasQR = Boolean(qrData?.available && qrData.qr);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Conecte o WhatsApp para atender em Conversas.</p>
        <Button onClick={() => void loadData()} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Estado da conexão com o WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-600">Conectado</p>
                  {status?.info?.pushname ? (
                    <p className="text-sm text-muted-foreground">Como {status.info.pushname}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-500">Desconectado</p>
                  <p className="text-sm text-muted-foreground">
                    {hasQR ? 'Escaneie o QR Code abaixo' : 'Aguardando o QR Code…'}
                  </p>
                </div>
              </>
            )}
          </div>
          {isConnected ? (
            <Link
              href="/dashboard/conversations"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ir para conversas
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>WhatsApp no celular → Aparelhos conectados → Conectar um aparelho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-6 py-6">
              {hasQR ? (
                <div className="rounded-lg bg-white p-4">
                  <img src={qrData!.qr!} alt="QR Code WhatsApp" className="h-64 w-64" />
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Aguardando geração do QR Code…</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
