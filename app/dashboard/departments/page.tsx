'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { Badge } from '@/ui/components/badge';
import { Plus, Users, MessageSquare } from 'lucide-react';
import { mockDepartmentRepository } from '@/infra/mocks/MockDepartmentRepository';
import { Department } from '@/core/entities/Department';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    isActive: true,
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const allDepartments = await mockDepartmentRepository.getAll();
      setDepartments(allDepartments);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const department: Department = {
        id: editingDepartment?.id || `dept-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        color: formData.color,
        isActive: formData.isActive,
        agentsCount: editingDepartment?.agentsCount || 0,
        conversationsCount: editingDepartment?.conversationsCount || 0,
        createdAt: editingDepartment?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      await mockDepartmentRepository.save(department);
      setShowForm(false);
      setEditingDepartment(null);
      setFormData({ name: '', description: '', color: '#3b82f6', isActive: true });
      loadDepartments();
    } catch (error) {
      console.error('Erro ao salvar setor:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este setor?')) {
      try {
        await mockDepartmentRepository.delete(id);
        loadDepartments();
      } catch (error) {
        console.error('Erro ao excluir setor:', error);
      }
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      color: department.color,
      isActive: department.isActive,
    });
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-foreground">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Setores</h1>
          <p className="text-muted-foreground mt-2">
            Organize conversas por setores e departamentos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingDepartment ? 'Editar Setor' : 'Novo Setor'}</CardTitle>
            <CardDescription>
              {editingDepartment ? 'Edite as informações do setor' : 'Crie um novo setor para organizar conversas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Setor</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-background"
                  placeholder="Ex: Vendas, Suporte, Financeiro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-background"
                  placeholder="Descreva a função deste setor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="bg-background"
                    placeholder="#3b82f6"
                  />
                </div>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDepartment(null);
                    setFormData({ name: '', description: '', color: '#3b82f6', isActive: true });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {departments.map((dept) => (
          <Card key={dept.id} className="relative">
            <div
              className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
              style={{ backgroundColor: dept.color }}
            />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{dept.name}</CardTitle>
                <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                  {dept.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <CardDescription>{dept.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{dept.agentsCount} atendentes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{dept.conversationsCount} conversas</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(dept)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(dept.id)}
                    className="flex-1"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

