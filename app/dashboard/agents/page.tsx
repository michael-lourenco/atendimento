'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { Agent } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { canSetAgentOffline, operatorForAgent } from '@/core/entities/agentStatus';
import { canChangeOperatorRole } from '@/core/entities/operatorRole';
import { User } from '@/core/entities/User';
import { CreateOperatorError } from '@/core/usecases/CreateOperatorUseCase';
import { Button } from '@/ui/components/button';
import { Plus } from 'lucide-react';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { emptyOperatorForm, OperatorForm, OperatorFormState } from './operator-form';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { AgentsTable } from '@/ui/components/agents-table';

const catalog = clientUseCases.agents;

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
      const user = await clientUseCases.currentUser().execute();
      const [agentList, departmentList] = await Promise.all([
        catalog().list(),
        clientUseCases.departments().list(),
      ]);
      setAgents(agentList);
      setDepartments(departmentList);
      setActor(user);
      if (user) {
        setOperators(await clientUseCases.listOperators().execute(user));
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
          await clientUseCases.setOperatorRole().execute(actor, linked.id, form.role);
        }
        if (linked && form.password.trim()) {
          await clientUseCases.setOperatorPassword().execute(actor, linked.id, form.password.trim());
        }
      } else {
        await clientUseCases.createOperator().execute(actor, {
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
      {formError && !showForm ? (
        <p className="mb-4 text-sm text-destructive">{formError}</p>
      ) : null}
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
          canSetPassword={Boolean(editingOperator)}
          canSetOffline={Boolean(
            editing && actor && canSetAgentOffline(actor, editing, agents, operators)
          )}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={reset}
        />
      ) : null}

      <AgentsTable
        loading={loading}
        agents={agents}
        visible={visible}
        operators={operators}
        actor={actor}
        departmentName={departmentName}
        filter={filter}
        onFilter={setFilter}
        onCreate={() => setShowForm(true)}
        onEdit={(agent) => {
          const linked = operatorForAgent(agent, operators);
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
        onDeleteOperator={async (operatorId) => {
          if (!actor) return;
          if (!(await confirm('Excluir este atendente? O login também some.'))) return;
          try {
            await clientUseCases.deleteOperator().execute(actor, operatorId);
            await load();
          } catch (error) {
            setFormError(
              error instanceof CreateOperatorError ? error.message : 'Não foi possível excluir'
            );
          }
        }}
        onDeactivate={async (agent) => {
          if (!(await confirm('Desativar este atendente (offline)?'))) return;
          try {
            await catalog().save({ ...agent, status: 'offline' });
            await load();
          } catch (error) {
            setFormError(
              error instanceof CreateOperatorError ? error.message : 'Não foi possível desativar'
            );
          }
        }}
        onDeleteAgent={async (agent) => {
          if (!(await confirm('Excluir este atendente?'))) return;
          await catalog().delete(agent.id);
          load();
        }}
      />
    </div>
  );
}
