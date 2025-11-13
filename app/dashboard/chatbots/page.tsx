'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Badge } from '@/ui/components/badge';
import { Plus } from 'lucide-react';

export default function ChatbotsPage() {
  const chatbots = [
    {
      id: '1',
      name: 'Atendimento Inicial',
      description: 'Chatbot para triagem inicial',
      isActive: true,
      messagesCount: 150,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Suporte Técnico',
      description: 'Chatbot para questões técnicas',
      isActive: true,
      messagesCount: 89,
      createdAt: new Date('2024-01-05'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chatbots</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus chatbots de atendimento
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Chatbot
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Chatbots</CardTitle>
          <CardDescription>Visualize e gerencie seus chatbots</CardDescription>
        </CardHeader>
        <CardContent>
          {chatbots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum chatbot encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatbots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>{bot.description}</TableCell>
                    <TableCell>
                      <Badge variant={bot.isActive ? 'default' : 'secondary'}>
                        {bot.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{bot.messagesCount}</TableCell>
                    <TableCell>
                      {new Date(bot.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
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

