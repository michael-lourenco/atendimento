'use client';

import { useEffect, useState } from 'react';
import { GetAllMessagesUseCase } from '@/core/usecases/GetAllMessagesUseCase';
import { Message } from '@/core/entities/Message';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const getAllMessagesUseCase = new GetAllMessagesUseCase();
      const allMessages = await getAllMessagesUseCase.execute();
      setMessages(allMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read':
        return 'bg-accent/20 text-accent-foreground border border-accent/30';
      case 'delivered':
        return 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30';
      case 'sent':
        return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
      case 'failed':
        return 'bg-destructive/20 text-destructive border border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
    }
  };

  const getDirectionBadge = (direction: string) => {
    return direction === 'incoming' ? 'Entrada' : 'Saída';
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Mensagens</h1>
        <p className="text-muted-foreground mt-2">
          Histórico de mensagens do chatbot
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
          <CardDescription>
            Visualize todas as mensagens recebidas e enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
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
                {messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-medium">
                      {message.direction === 'incoming' ? message.from : message.to}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          message.direction === 'incoming'
                            ? 'bg-primary/20 text-primary-foreground border border-primary/30'
                            : 'bg-secondary/50 text-secondary-foreground border border-secondary'
                        }`}
                      >
                        {getDirectionBadge(message.direction)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{message.content}</TableCell>
                    <TableCell>{message.type}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(message.status)}`}
                      >
                        {message.status}
                      </span>
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

