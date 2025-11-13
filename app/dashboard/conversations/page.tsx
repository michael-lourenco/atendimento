'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/components/tabs';
import { Search, ArrowRight, Building2 } from 'lucide-react';
import { mockConversationRepository } from '@/infra/mocks/MockConversationRepository';
import { Conversation } from '@/core/entities/Conversation';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    setMounted(true);
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const allConversations = await mockConversationRepository.getAll();
      setConversations(allConversations);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (conversationId: string, targetAgentId: string, targetAgentName: string) => {
    try {
      const conversation = await mockConversationRepository.getById(conversationId);
      if (conversation) {
        const updated = {
          ...conversation,
          assignedAgentId: targetAgentId,
          assignedAgentName: targetAgentName,
          status: 'transferred' as const,
        };
        await mockConversationRepository.save(updated);
        loadConversations();
      }
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
    }
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // Filtrar por aba
    switch (activeTab) {
      case 'incoming':
        filtered = filtered.filter(conv => conv.status === 'open' && !conv.assignedAgentId);
        break;
      case 'waiting':
        filtered = filtered.filter(conv => conv.status === 'waiting' || (conv.status === 'open' && conv.assignedAgentId));
        break;
      case 'closed':
        filtered = filtered.filter(conv => conv.status === 'closed');
        break;
      default:
        break;
    }

    // Filtrar por busca
    if (filter) {
      const searchTerm = filter.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.contactName.toLowerCase().includes(searchTerm) ||
          conv.contactPhone.includes(searchTerm) ||
          conv.departmentName?.toLowerCase().includes(searchTerm) ||
          conv.assignedAgentName?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  };

  const filteredConversations = getFilteredConversations();

  if (loading) {
    return <div className="text-center py-8 text-foreground">Carregando...</div>;
  }

  const formatDate = (date: Date) => {
    if (!mounted) return '';
    return new Date(date).toLocaleString('pt-BR');
  };

  const renderConversationsTable = () => {
    if (filteredConversations.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma conversa encontrada
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contato</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Setor</TableHead>
            <TableHead>Atendente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Não Lidas</TableHead>
            <TableHead>Última Atividade</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredConversations.map((conv) => (
            <TableRow key={conv.id}>
              <TableCell className="font-medium">{conv.contactPhone}</TableCell>
              <TableCell>{conv.contactName}</TableCell>
              <TableCell>
                {conv.departmentName ? (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <Building2 className="h-3 w-3" />
                    {conv.departmentName}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {conv.assignedAgentName || (
                  <span className="text-muted-foreground">Não atribuído</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    conv.status === 'open'
                      ? 'default'
                      : conv.status === 'closed'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {conv.status === 'open'
                    ? 'Aberta'
                    : conv.status === 'closed'
                    ? 'Fechada'
                    : conv.status === 'transferred'
                    ? 'Transferida'
                    : 'Aguardando'}
                </Badge>
              </TableCell>
              <TableCell>
                {conv.unreadCount > 0 && (
                  <Badge variant="destructive">{conv.unreadCount}</Badge>
                )}
              </TableCell>
              <TableCell>{formatDate(conv.lastActivity)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Abrir
                  </Button>
                  {activeTab !== 'closed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransfer(conv.id, '2', 'Carlos Santos')}
                      title="Transferir conversa"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const incomingCount = conversations.filter(conv => conv.status === 'open' && !conv.assignedAgentId).length;
  const waitingCount = conversations.filter(conv => conv.status === 'waiting' || (conv.status === 'open' && conv.assignedAgentId)).length;
  const closedCount = conversations.filter(conv => conv.status === 'closed').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Conversas</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todas as conversas do WhatsApp
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Conversas</CardTitle>
              <CardDescription>Visualize e gerencie suas conversas</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-10 w-64 bg-background"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="incoming">
                Entrada
                {incomingCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {incomingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="waiting">
                Esperando
                {waitingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {waitingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="closed">
                Finalizados
                {closedCount > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {closedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="incoming" className="mt-4">
              {renderConversationsTable()}
            </TabsContent>
            <TabsContent value="waiting" className="mt-4">
              {renderConversationsTable()}
            </TabsContent>
            <TabsContent value="closed" className="mt-4">
              {renderConversationsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

