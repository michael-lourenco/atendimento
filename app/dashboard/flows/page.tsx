'use client';

import { useEffect, useState } from 'react';
import { GetAllFlowsUseCase } from '@/core/usecases/GetAllFlowsUseCase';
import { DeleteFlowUseCase } from '@/core/usecases/DeleteFlowUseCase';
import { SaveFlowUseCase } from '@/core/usecases/SaveFlowUseCase';
import { Flow, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { DepartmentCatalogUseCase } from '@/core/usecases/DepartmentCatalogUseCase';
import { resolveActiveFlow } from '@/core/engine/resolveActiveFlow';
import { FlowStepsEditor } from '@/ui/components/flow-steps-editor';
import { EmptyState } from '@/ui/components/empty-state';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { Badge } from '@/ui/components/badge';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    isActive: true,
  });
  const { confirm, dialog } = useConfirm();
  const { show, markSaved } = useCatalogSavedFlash();

  useEffect(() => {
    void loadFlows(true);
  }, []);

  const loadFlows = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [allFlows, departmentList] = await Promise.all([
        new GetAllFlowsUseCase().execute(),
        new DepartmentCatalogUseCase().list(),
      ]);
      setFlows(allFlows);
      setDepartments(departmentList);
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Excluir este fluxo?'))) {
      return;
    }
    try {
      const deleteFlowUseCase = new DeleteFlowUseCase();
      await deleteFlowUseCase.execute(id);
      loadFlows();
    } catch (error) {
      console.error('Erro ao excluir fluxo:', error);
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
    setSteps(flow.steps);
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
        steps,
        createdAt: editingFlow?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      await saveFlowUseCase.execute(flow);
      setShowForm(false);
      setEditingFlow(null);
      setSteps([]);
      setFormData({ id: '', name: '', description: '', isActive: true });
      markSaved();
      loadFlows();
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFlow(null);
    setSteps([]);
    setFormData({ id: '', name: '', description: '', isActive: true });
  };

  const openNew = () => {
    setEditingFlow(null);
    setSteps([]);
    setFormData({ id: '', name: '', description: '', isActive: true });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <p className="text-muted-foreground">Roteiro do chatbot no WhatsApp.</p>
        </div>
        <CatalogListSkeleton />
      </div>
    );
  }

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          O roteiro que o chatbot envia no WhatsApp. Só um fluxo ativo entra no ar.
        </p>
        <Button onClick={openNew}>Novo Fluxo</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingFlow ? 'Editar Fluxo' : 'Novo Fluxo'}</CardTitle>
            <CardDescription>
              {editingFlow
                ? 'Clique num bloco para editar o que o cliente recebe. Salve no final.'
                : 'Monte o roteiro: mensagem, pergunta ou setor. O cliente recebe nessa ordem.'}
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
              <FlowStepsEditor
                steps={steps}
                departments={departments}
                flows={flows}
                currentFlowId={formData.id || editingFlow?.id}
                onChange={setSteps}
              />
              <div className="sticky bottom-0 z-10 flex space-x-2 border-t border-border bg-card py-3">
                <Button type="submit">Salvar fluxo</Button>
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
          <CardDescription>O selo WhatsApp indica qual fluxo está no ar</CardDescription>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <EmptyState
              title="Nenhum fluxo cadastrado"
              description="Crie o Atendimento Inicial: o cliente recebe as mensagens nesta ordem no WhatsApp."
              actionLabel="Novo fluxo"
              onAction={openNew}
            />
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
                    <TableCell className="font-medium">
                      <span className="mr-2">{flow.name}</span>
                      {resolveActiveFlow(flows)?.id === flow.id ? (
                        <Badge variant="success">WhatsApp</Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>{flow.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={flow.isActive ? 'success' : 'muted'}>
                        {flow.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
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

