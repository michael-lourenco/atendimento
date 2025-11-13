'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Badge } from '@/ui/components/badge';
import { ScrollArea } from '@/ui/components/scroll-area';
import { Send, User, ArrowRight, MessageCircle } from 'lucide-react';
import { mockInternalMessageRepository } from '@/infra/mocks/MockInternalMessageRepository';
import { mockConversationRepository } from '@/infra/mocks/MockConversationRepository';
import { InternalMessage } from '@/core/entities/InternalMessage';
import { Conversation } from '@/core/entities/Conversation';

export default function InternalChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId] = useState('1');
  const [currentUserName] = useState('Você');
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const allConversations = await mockConversationRepository.getAll();
      setConversations(allConversations);
      if (allConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(allConversations[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const conversationMessages = await mockInternalMessageRepository.getByConversation(
        conversationId
      );
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const message: InternalMessage = {
      id: `msg-${Date.now()}`,
      from: currentUserId,
      fromName: currentUserName,
      conversationId: selectedConversation.id,
      content: newMessage,
      type: 'text',
      timestamp: new Date(),
      departmentId: selectedConversation.departmentId,
    };

    try {
      await mockInternalMessageRepository.save(message);
      setNewMessage('');
      loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleTransfer = async (targetAgentId: string, targetAgentName: string) => {
    if (!selectedConversation) return;

    const transferMessage: InternalMessage = {
      id: `transfer-${Date.now()}`,
      from: currentUserId,
      fromName: currentUserName,
      to: targetAgentId,
      toName: targetAgentName,
      conversationId: selectedConversation.id,
      content: `Conversa transferida para ${targetAgentName}`,
      type: 'transfer',
      timestamp: new Date(),
      departmentId: selectedConversation.departmentId,
    };

    try {
      await mockInternalMessageRepository.save(transferMessage);
      const updatedConversation = {
        ...selectedConversation,
        assignedAgentId: targetAgentId,
        assignedAgentName: targetAgentName,
        status: 'transferred' as const,
      };
      await mockConversationRepository.save(updatedConversation);
      setSelectedConversation(updatedConversation);
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      console.error('Erro ao transferir conversa:', error);
    }
  };

  const formatTime = (date: Date) => {
    if (!mounted) return '';
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!mounted) {
    return (
      <div className="h-[calc(100vh-12rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Chat Interno</h1>
          <p className="text-muted-foreground mt-2">
            Comunicação em tempo real entre atendentes
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Chat Interno</h1>
        <p className="text-muted-foreground mt-2">
          Comunicação em tempo real entre atendentes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversas</CardTitle>
            <CardDescription>Selecione uma conversa para ver o chat interno</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.contactName}</p>
                        <p className="text-sm opacity-80 truncate">{conv.contactPhone}</p>
                        {conv.departmentName && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {conv.departmentName}
                          </Badge>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedConversation.contactName}</CardTitle>
                    <CardDescription>
                      {selectedConversation.contactPhone}
                      {selectedConversation.departmentName && (
                        <span className="ml-2">
                          • {selectedConversation.departmentName}
                        </span>
                      )}
                      {selectedConversation.assignedAgentName && (
                        <span className="ml-2">
                          • Atendente: {selectedConversation.assignedAgentName}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTransfer('2', 'Carlos Santos')}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Transferir
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${
                          msg.from === currentUserId ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                        <div
                          className={`flex-1 max-w-[70%] ${
                            msg.from === currentUserId ? 'items-end' : 'items-start'
                          } flex flex-col`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {msg.fromName}
                            </span>
                            {msg.toName && (
                              <>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {msg.toName}
                                </span>
                              </>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg p-3 ${
                              msg.type === 'transfer'
                                ? 'bg-accent/20 border border-accent'
                                : msg.from === currentUserId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            {msg.type === 'transfer' && (
                              <Badge variant="outline" className="mt-2">
                                Transferência
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite uma mensagem interna..."
                      className="bg-background flex-1"
                    />
                    <Button type="submit" disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para ver o chat interno</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

