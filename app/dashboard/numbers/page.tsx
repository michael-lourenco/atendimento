'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Badge } from '@/ui/components/badge';
import { Plus } from 'lucide-react';

export default function NumbersPage() {
  const [showForm, setShowForm] = useState(false);
  const numbers = [
    {
      id: '1',
      number: '5511999999999',
      name: 'Número Principal',
      status: 'active',
      provider: 'WhatsApp Business API',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      number: '5511888888888',
      name: 'Número Secundário',
      status: 'active',
      provider: 'WhatsApp Business API',
      createdAt: new Date('2024-01-05'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diversos Números</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os números do WhatsApp conectados
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Número
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Números Conectados</CardTitle>
          <CardDescription>Visualize e gerencie seus números do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {numbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum número encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provedor</TableHead>
                  <TableHead>Data de Conexão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {numbers.map((num) => (
                  <TableRow key={num.id}>
                    <TableCell className="font-medium">{num.name}</TableCell>
                    <TableCell>{num.number}</TableCell>
                    <TableCell>
                      <Badge variant={num.status === 'active' ? 'default' : 'secondary'}>
                        {num.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{num.provider}</TableCell>
                    <TableCell>
                      {new Date(num.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm">
                          Desconectar
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

