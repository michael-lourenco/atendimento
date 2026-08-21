'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Conversation } from '@/core/entities/Conversation';
import { Message } from '@/core/entities/Message';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { historyStatusLabel, historyTypeLabel } from '@/core/entities/historyThread';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { MessageMedia } from '@/ui/components/message-media';
import { Badge } from '@/ui/components/badge';
import { Input } from '@/ui/components/input';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { EmptyState } from '@/ui/components/empty-state';
import { messagesMatchingQuery } from '@/ui/lib/messages-matching-query';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { historyContactLabel, historyHrefForMessage } from '@/ui/lib/history-href';

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactFilter = searchParams.get('contact');

  const loadMessages = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [allMessages, conversationList, numberList] = await Promise.all([
        clientUseCases.allMessages().execute(),
        clientUseCases.conversations().execute(false),
        listWhatsAppNumbersCached(),
      ]);
      setMessages(allMessages);
      setConversations(conversationList);
      setNumbers(numberList);
    } catch {
      /* ignore */
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

  const messageStatusVariant = (status: string, incoming: boolean) => {
    if (incoming) return 'info' as const;
    if (status === 'read') return 'success' as const;
    if (status === 'delivered') return 'info' as const;
    if (status === 'sent' || status === 'pending') return 'warning' as const;
    if (status === 'failed') return 'destructive' as const;
    return 'muted' as const;
  };

  const visible = messagesMatchingQuery(messages, filter);

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
        <p className="text-muted-foreground">Clique numa linha para abrir o atendimento.</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar no histórico"
          className="bg-background pl-10"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
          <CardDescription>Cada linha abre a conversa na inbox</CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <EmptyState
              title="Nenhuma mensagem encontrada"
              description="Quando o WhatsApp receber ou enviar, elas aparecem aqui. Clique numa linha para abrir o atendimento."
            />
          ) : (
            <div className="overflow-x-auto">
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
                  <TableRow
                    key={message.id}
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(historyHrefForMessage(message, conversations, numbers))
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(historyHrefForMessage(message, conversations, numbers));
                      }
                    }}
                  >
                    <TableCell className="font-medium">
                      {historyContactLabel(message, conversations, numbers)}
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
                    <TableCell>{historyTypeLabel(message.type)}</TableCell>
                    <TableCell>
                      <Badge variant={messageStatusVariant(message.status, message.direction === 'incoming')}>
                        {historyStatusLabel(message)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(message.timestamp)}</TableCell>
                    <TableCell>{message.flowId || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
