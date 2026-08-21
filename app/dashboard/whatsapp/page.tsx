'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { defaultEvolutionInstanceName } from '@/core/entities/whatsappNumberLine';
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryInstance = searchParams.get('instance') ?? '';
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [instance, setInstance] = useState(queryInstance || defaultEvolutionInstanceName());
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void clientUseCases.whatsAppNumbers().list().then((rows) => {
      setNumbers(rows);
      if (!queryInstance) {
        const first = rows.find((item) => item.instanceName)?.instanceName;
        setInstance(first || defaultEvolutionInstanceName());
      }
    });
  }, [queryInstance]);

  useEffect(() => {
    if (queryInstance) {
      setInstance(queryInstance);
    }
  }, [queryInstance]);

  const loadData = async (name = instance) => {
    try {
      setRefreshing(true);
      if (!name) {
        return;
      }
      const query = `?instance=${encodeURIComponent(name)}`;
      const [qrResponse, statusResponse] = await Promise.all([
        fetch(`/api/chat-whatsapp/qr${query}`),
        fetch(`/api/chat-whatsapp/status${query}`),
      ]);
      if (qrResponse.ok) {
        setQrData(await qrResponse.json());
      }
      if (statusResponse.ok) {
        setStatus(await statusResponse.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!instance) return;
    void loadData(instance);
    const timer = setInterval(() => {
      if (!status?.connected) {
        void loadData(instance);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [instance, status?.connected]);

  const isConnected = Boolean(status?.connected);
  const hasQR = Boolean(qrData?.available && qrData.qr);
  const lines = numbers.filter((item) => item.instanceName);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">Conecte cada número da empresa com o QR do celular.</p>
        <Button onClick={() => void loadData()} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {lines.length > 0 ? (
        <label className="block max-w-sm space-y-2 text-sm">
          <span className="text-muted-foreground">Linha</span>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={instance}
            onChange={(event) => {
              const next = event.target.value;
              setInstance(next);
              setStatus(null);
              router.replace(`/dashboard/whatsapp?instance=${encodeURIComponent(next)}`);
            }}
          >
            {lines.map((item) => (
              <option key={item.id} value={item.instanceName}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            {lines.find((item) => item.instanceName === instance)?.name || 'Linha do WhatsApp'}
          </CardDescription>
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
