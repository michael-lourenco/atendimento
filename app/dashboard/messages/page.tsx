'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GetAllMessagesUseCase } from '@/core/usecases/GetAllMessagesUseCase';
import { Message } from '@/core/entities/Message';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { MessageMedia } from '@/ui/components/message-media';
import { Badge } from '@/ui/components/badge';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactFilter = searchParams.get('contact');

  const loadMessages = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const allMessages = await new GetAllMessagesUseCase().execute();
      setMessages(allMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (contactFilter) {
      router.replace(`/dashboard/conversations?contact=${encodeURIComponent(contactFilter)}`);
      return;
    }
    loadMessages(true);
    const timer = setInterval(() => loadMessages(false), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, [contactFilter, router]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const messageStatusVariant = (status: string) => {
    if (status === 'read') return 'success' as const;
    if (status === 'delivered') return 'info' as const;
    if (status === 'sent' || status === 'pending') return 'warning' as const;
    if (status === 'failed') return 'destructive' as const;
    return 'muted' as const;
  };

  const visible = messages;

  if (contactFilter) {
    return <div className="py-8 text-center text-muted-foreground">Abrindo conversa...</div>;
  }

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <p className="text-muted-foreground">Histórico geral. O atendimento fica em Conversas.</p>
        </div>
        <CatalogListSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">Histórico geral. O atendimento fica em Conversas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
          <CardDescription>
            Visualize todas as mensagens recebidas e enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Direção</TableHead>
                  <TableHead>Conteúdo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Fluxo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">
                      {message.direction === 'incoming' ? message.from : message.to}
                    </TableCell>
                    <TableCell>
                      <Badge variant={message.direction === 'incoming' ? 'info' : 'success'}>
                        {message.direction === 'incoming' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md align-top">
                      <MessageMedia
                        id={message.id}
                        type={message.type}
                        content={message.content}
                      />
                    </TableCell>
                    <TableCell>{message.type}</TableCell>
                    <TableCell>
                      <Badge variant={messageStatusVariant(message.status)}>{message.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(message.timestamp)}</TableCell>
                    <TableCell>{message.flowId || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

