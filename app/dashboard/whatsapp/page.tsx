'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { RefreshCw, CheckCircle2, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/tabs';
import { Badge } from '@/ui/components/badge';
import { ScrollArea } from '@/ui/components/scroll-area';

interface QRCodeData {
  qr: string | null;
  available: boolean;
  connected: boolean;
}

interface StatusData {
  connected: boolean;
  qrAvailable: boolean;
  info: {
    wid: string | null;
    pushname: string | null;
    platform: string | null;
  } | null;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: string;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status: string;
}

interface MessagesResponse {
  messages: WhatsAppMessage[];
  total: number;
  limit: number;
  offset: number;
}

export default function WhatsAppPage() {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [lastQRCode, setLastQRCode] = useState<string | null>(null);
  const [qrCodeStableCount, setQrCodeStableCount] = useState(0);
  const [messagesEndpointAvailable, setMessagesEndpointAvailable] = useState<boolean | null>(null);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Carregar QR Code e Status em paralelo
      const [qrResponse, statusResponse] = await Promise.all([
        fetch('/api/chat-whatsapp/qr'),
        fetch('/api/chat-whatsapp/status'),
      ]);

      if (qrResponse.ok) {
        const qr = await qrResponse.json();
        setQrData(qr);
        
        // Detecta se QR Code está estável (não mudou)
        // Se o QR Code não mudou por várias verificações, pode estar conectado
        if (qr.qr === lastQRCode && qr.qr !== null) {
          setQrCodeStableCount(prev => prev + 1);
        } else {
          setQrCodeStableCount(0);
          setLastQRCode(qr.qr);
        }
      }

      if (statusResponse.ok) {
        const stat = await statusResponse.json();
        console.log('[WhatsAppPage] Status recebido:', stat);
        setStatus(stat);
      } else {
        console.error('[WhatsAppPage] Erro ao obter status:', statusResponse.status);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMessages = async () => {
    try {
      setMessagesLoading(true);
      const response = await fetch('/api/chat-whatsapp/messages?limit=100');
      if (response.ok) {
        const data: MessagesResponse = await response.json();
        setMessages(data.messages);
        setMessagesEndpointAvailable(true);
      } else if (response.status === 500) {
        // Verifica se é erro porque o endpoint não existe no servidor
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message?.includes('não encontrado') || errorData.message?.includes('404')) {
          setMessagesEndpointAvailable(false);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      // Se for erro de rede ou 404, assume que endpoint não existe
      setMessagesEndpointAvailable(false);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadMessages();
    
    // Auto-refresh a cada 5 segundos se não estiver conectado
    const qrInterval = setInterval(() => {
      if (!status?.connected) {
        loadData();
      }
    }, 5000);

    // Auto-refresh mensagens a cada 3 segundos se estiver conectado
    // Também atualiza status periodicamente para detectar mudanças
    const messagesInterval = setInterval(() => {
      if (status?.connected) {
        loadMessages();
      } else {
        // Se não está conectado, verifica status periodicamente (a cada 10s)
        loadData();
      }
    }, status?.connected ? 3000 : 10000);

    return () => {
      clearInterval(qrInterval);
      clearInterval(messagesInterval);
    };
  }, [status?.connected]);

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Lógica de detecção de conexão:
  // 1. Se status diz que está conectado, usa isso
  // 2. Se não, verifica se QR Code está estável (não mudou por várias verificações)
  //    Isso indica que pode estar conectado (QR Code não está sendo regenerado)
  const isConnected = status?.connected || (qrCodeStableCount >= 3 && !qrData?.available);
  const hasQR = qrData?.available || false;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserId = (from: string) => {
    return from.split('@')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a conexão do WhatsApp e visualize mensagens
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Conexão</TabsTrigger>
          <TabsTrigger value="messages">
            Mensagens
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {messages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">

      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
          <CardDescription>
            Estado atual da conexão com o WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-semibold text-green-500">Conectado</p>
                  {status?.info?.pushname && (
                    <p className="text-sm text-muted-foreground">
                      Conectado como: {status.info.pushname}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-semibold text-red-500">Desconectado</p>
                  <p className="text-sm text-muted-foreground">
                    {hasQR
                      ? 'Escaneie o QR Code abaixo para conectar'
                      : 'Aguardando geração do QR Code...'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code para Conexão</CardTitle>
            <CardDescription>
              Escaneie este QR Code com seu WhatsApp para conectar o bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-6 py-8">
              {hasQR && qrData?.qr ? (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-lg">
                    <img
                      src={qrData.qr}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">
                      Instruções para conectar:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 text-left max-w-md">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Vá em Menu → Aparelhos conectados → Conectar um aparelho</li>
                      <li>3. Escaneie o QR Code acima</li>
                      <li>4. Aguarde a confirmação da conexão</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Aguardando geração do QR Code...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O QR Code será exibido automaticamente quando estiver disponível
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações Adicionais */}
      {isConnected && status?.info && (
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conexão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.info.wid && (
                <div>
                  <span className="text-sm font-medium">ID do WhatsApp:</span>
                  <p className="text-sm text-muted-foreground">{status.info.wid}</p>
                </div>
              )}
              {status.info.platform && (
                <div>
                  <span className="text-sm font-medium">Plataforma:</span>
                  <p className="text-sm text-muted-foreground">{status.info.platform}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mensagens Recentes</CardTitle>
                  <CardDescription>
                    Visualize todas as mensagens recebidas e enviadas
                  </CardDescription>
                </div>
                <Button
                  onClick={loadMessages}
                  disabled={messagesLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${messagesLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {messagesEndpointAvailable === false ? (
                    <>
                      <p className="font-semibold text-foreground mb-2">Endpoint de mensagens não disponível</p>
                      <p className="text-sm">
                        O servidor na AWS precisa ser atualizado para exibir mensagens.
                      </p>
                      <p className="text-xs mt-2 text-muted-foreground">
                        As mensagens estão sendo processadas, mas não podem ser recuperadas pela versão antiga do servidor.
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        Faça o deploy da versão nova do servidor para habilitar esta funcionalidade.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-sm mt-2">
                        As mensagens aparecerão aqui quando o WhatsApp estiver conectado
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isIncoming = msg.direction === 'incoming';
                      const userId = isIncoming ? getUserId(msg.from) : getUserId(msg.to);
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isIncoming ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isIncoming
                                ? 'bg-muted text-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={isIncoming ? 'secondary' : 'default'} className="text-xs">
                                {isIncoming ? 'Recebida' : 'Enviada'}
                              </Badge>
                              <span className="text-xs opacity-70">
                                {userId}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatTimestamp(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

