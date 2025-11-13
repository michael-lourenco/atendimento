'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Badge } from '@/ui/components/badge';
import { Plus } from 'lucide-react';

export default function TagsPage() {
  const [showForm, setShowForm] = useState(false);
  const tags = [
    {
      id: '1',
      name: 'Cliente',
      color: '#3b82f6',
      contactsCount: 45,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'VIP',
      color: '#f59e0b',
      contactsCount: 12,
      createdAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      name: 'Prospecto',
      color: '#10b981',
      contactsCount: 23,
      createdAt: new Date('2024-01-03'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Etiquetas</h1>
          <p className="text-muted-foreground mt-2">
            Organize contatos com etiquetas personalizadas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Etiqueta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Etiquetas</CardTitle>
          <CardDescription>Visualize e gerencie suas etiquetas</CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma etiqueta encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-muted-foreground">{tag.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tag.contactsCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(tag.createdAt).toLocaleDateString('pt-BR')}
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

