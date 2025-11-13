'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Badge } from '@/ui/components/badge';
import { Plus, Calendar } from 'lucide-react';

export default function SchedulesPage() {
  const [showForm, setShowForm] = useState(false);
  const schedules = [
    {
      id: '1',
      contact: '5511999999999',
      message: 'Lembrete: Reunião amanhã às 10h',
      scheduledDate: new Date('2024-01-16T10:00:00'),
      status: 'pending',
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      contact: '5511888888888',
      message: 'Promoção especial para você!',
      scheduledDate: new Date('2024-01-17T14:00:00'),
      status: 'sent',
      createdAt: new Date('2024-01-14'),
    },
  ];

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamento</h1>
          <p className="text-muted-foreground mt-2">
            Agende o envio de mensagens para o futuro
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens Agendadas</CardTitle>
          <CardDescription>Visualize e gerencie suas mensagens agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem agendada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contato</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Data/Hora Agendada</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.contact}</TableCell>
                    <TableCell className="max-w-md truncate">{schedule.message}</TableCell>
                    <TableCell>{formatDateTime(schedule.scheduledDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          schedule.status === 'sent'
                            ? 'default'
                            : schedule.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {schedule.status === 'sent'
                          ? 'Enviada'
                          : schedule.status === 'pending'
                          ? 'Pendente'
                          : 'Falhou'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(schedule.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {schedule.status === 'pending' && (
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        )}
                        <Button variant="destructive" size="sm">
                          {schedule.status === 'pending' ? 'Cancelar' : 'Excluir'}
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

