'use client';

import { useEffect, useState } from 'react';
import { GetAllFlowsUseCase } from '@/core/usecases/GetAllFlowsUseCase';
import { DeleteFlowUseCase } from '@/core/usecases/DeleteFlowUseCase';
import { SaveFlowUseCase } from '@/core/usecases/SaveFlowUseCase';
import { Flow } from '@/core/entities/Flow';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const getAllFlowsUseCase = new GetAllFlowsUseCase();
      const allFlows = await getAllFlowsUseCase.execute();
      setFlows(allFlows);
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fluxo?')) {
      try {
        const deleteFlowUseCase = new DeleteFlowUseCase();
        await deleteFlowUseCase.execute(id);
        loadFlows();
      } catch (error) {
        console.error('Erro ao excluir fluxo:', error);
      }
    }
  };

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow);
    setFormData({
      id: flow.id,
      name: flow.name,
      description: flow.description || '',
      isActive: flow.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saveFlowUseCase = new SaveFlowUseCase();
      const flow: Flow = {
        id: formData.id || `flow-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        steps: editingFlow?.steps || [],
        createdAt: editingFlow?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      await saveFlowUseCase.execute(flow);
      setShowForm(false);
      setEditingFlow(null);
      setFormData({ id: '', name: '', description: '', isActive: true });
      loadFlows();
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFlow(null);
    setFormData({ id: '', name: '', description: '', isActive: true });
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Carregando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Fluxos de Atendimento</h1>
        <Button onClick={() => setShowForm(true)}>Novo Fluxo</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingFlow ? 'Editar Fluxo' : 'Novo Fluxo'}</CardTitle>
            <CardDescription>
              {editingFlow ? 'Edite as informações do fluxo' : 'Crie um novo fluxo de atendimento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-border accent-accent"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Ativo</Label>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">Salvar</Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fluxos</CardTitle>
          <CardDescription>Gerencie os fluxos de atendimento do chatbot</CardDescription>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fluxo cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((flow) => (
                  <TableRow key={flow.id}>
                    <TableCell className="font-medium">{flow.name}</TableCell>
                    <TableCell>{flow.description || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          flow.isActive
                            ? 'bg-accent/20 text-accent-foreground border border-accent/30'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {flow.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>{flow.steps.length}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(flow)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(flow.id)}
                        >
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

