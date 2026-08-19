'use client';

import { useEffect, useState } from 'react';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { canChangeOperatorRole } from '@/core/entities/operatorRole';
import { User } from '@/core/entities/User';
import { AgentCatalogUseCase } from '@/core/usecases/AgentCatalogUseCase';
import { CreateOperatorError, CreateOperatorUseCase } from '@/core/usecases/CreateOperatorUseCase';
import { DepartmentCatalogUseCase } from '@/core/usecases/DepartmentCatalogUseCase';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { ListOperatorsUseCase } from '@/core/usecases/ListOperatorsUseCase';
import { SetOperatorRoleUseCase } from '@/core/usecases/SetOperatorRoleUseCase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Badge } from '@/ui/components/badge';
import { EmptyState } from '@/ui/components/empty-state';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { Plus, Search } from 'lucide-react';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { emptyOperatorForm, OperatorForm, OperatorFormState } from './operator-form';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';

const catalog = () => new AgentCatalogUseCase();

function operatorForAgent(agent: Agent, operators: User[]): User | undefined {
  const email = agent.email.trim().toLowerCase();
  return (
    operators.find((item) => item.id === agent.id) ??
    operators.find((item) => item.email.trim().toLowerCase() === email)
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [operators, setOperators] = useState<User[]>([]);
  const [actor, setActor] = useState<User | null>(null);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<OperatorFormState>(emptyOperatorForm);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const { confirm, dialog } = useConfirm();
  const { show, markSaved } = useCatalogSavedFlash();

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const user = await new GetCurrentUserUseCase().execute();
      const [agentList, departmentList] = await Promise.all([
        catalog().list(),
        new DepartmentCatalogUseCase().list(),
      ]);
      setAgents(agentList);
      setDepartments(departmentList);
      setActor(user);
      if (user) {
        setOperators(await new ListOperatorsUseCase().execute(user));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
  }, []);

  const reset = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyOperatorForm);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setFormError('');
    try {
      if (editing) {
        await catalog().save({
          ...editing,
          name: form.name,
          status: form.status,
          departmentId: form.departmentId || undefined,
        });
        const linked = operatorForAgent(editing, operators);
        if (linked && linked.role !== form.role) {
          await new SetOperatorRoleUseCase().execute(actor, linked.id, form.role);
        }
      } else {
        await new CreateOperatorUseCase().execute(actor, {
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          departmentId: form.departmentId || undefined,
        });
      }
      reset();
      markSaved();
      await load();
    } catch (error) {
      setFormError(error instanceof CreateOperatorError ? error.message : 'Não foi possível salvar');
    }
  };

  const visible = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(filter.toLowerCase()) ||
      agent.email.toLowerCase().includes(filter.toLowerCase())
  );
  const departmentName = (id?: string) => departments.find((item) => item.id === id)?.name ?? '—';
  const editingOperator = editing ? operatorForAgent(editing, operators) : undefined;
  const lastAdmin = Boolean(
    actor &&
      editingOperator &&
      !canChangeOperatorRole(actor, operators, editingOperator.id, 'user')
  );

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} />
      <div className="mb-6 flex justify-between items-center">
        <p className="text-muted-foreground">
          Cada login já é um agente. O admin cadastra atendentes e define o papel.
        </p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Atendente
        </Button>
      </div>

      {showForm ? (
        <OperatorForm
          editing={Boolean(editing)}
          form={form}
          error={formError}
          departments={departments}
          lastAdmin={lastAdmin}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={reset}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Atendentes</CardTitle>
              <CardDescription>Quem assume, transfere e acessa o painel</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atendentes..."
                className="pl-10 w-64 bg-background"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CatalogListSkeleton />
          ) : visible.length === 0 ? (
            <EmptyState
              title={agents.length === 0 ? 'Nenhum atendente' : 'Nenhum atendente encontrado'}
              description={
                agents.length === 0 ? 'Cadastre o time com e-mail, senha, papel e setor.' : undefined
              }
              actionLabel={agents.length === 0 ? 'Novo atendente' : undefined}
              onAction={agents.length === 0 ? () => setShowForm(true) : undefined}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((agent) => {
                  const linked = operatorForAgent(agent, operators);
                  return (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">
                        {agent.name}
                        {actor && agent.id === actor.id ? (
                          <Badge variant="info" className="ml-2">
                            Você
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>{agent.email}</TableCell>
                      <TableCell>
                        {linked ? (linked.role === 'admin' ? 'Admin' : 'Atendente') : '—'}
                      </TableCell>
                      <TableCell>{departmentName(agent.departmentId)}</TableCell>
                      <TableCell>
                        <Badge variant={agent.status === 'online' ? 'success' : 'muted'}>
                          {agent.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(agent);
                              setFormError('');
                              setForm({
                                name: agent.name,
                                email: agent.email,
                                password: '',
                                role: linked?.role ?? 'user',
                                status: agent.status,
                                departmentId: agent.departmentId ?? '',
                              });
                              setShowForm(true);
                            }}
                          >
                            Editar
                          </Button>
                          {linked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!(await confirm('Desativar este atendente (offline)?'))) return;
                                await catalog().save({ ...agent, status: 'offline' });
                                load();
                              }}
                            >
                              Desativar
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={async () => {
                                if (!(await confirm('Excluir este atendente?'))) return;
                                await catalog().delete(agent.id);
                                load();
                              }}
                            >
                              Excluir
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
