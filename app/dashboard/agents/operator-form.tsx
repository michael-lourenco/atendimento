'use client';

import { AgentStatus } from '@/core/entities/Agent';
import { Department } from '@/core/entities/Department';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';

export type OperatorFormState = {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  status: AgentStatus;
  departmentId: string;
};

export const emptyOperatorForm: OperatorFormState = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  status: 'online',
  departmentId: '',
};

export function OperatorForm({
  editing,
  form,
  error,
  departments,
  lastAdmin,
  canSetPassword,
  onChange,
  onSubmit,
  onCancel,
}: {
  editing: boolean;
  form: OperatorFormState;
  error: string;
  departments: Department[];
  lastAdmin: boolean;
  canSetPassword?: boolean;
  onChange: (next: OperatorFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{editing ? 'Editar atendente' : 'Novo atendente'}</CardTitle>
        <CardDescription>
          {editing
            ? 'Setor, status e papel entram na fila. Nova senha é opcional (mín. 6).'
            : 'Cria o login e o agente com o mesmo id. O atendente entra com e-mail e senha.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              required
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => onChange({ ...form, email: e.target.value })}
              required
              disabled={editing}
              className="bg-background"
            />
          </div>
          {editing ? (
            canSetPassword ? (
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => onChange({ ...form, password: e.target.value })}
                  minLength={6}
                  placeholder="Deixe em branco para manter"
                  className="bg-background"
                />
              </div>
            ) : null
          ) : (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="bg-background"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <select
              id="role"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.role}
              onChange={(e) => onChange({ ...form, role: e.target.value as 'admin' | 'user' })}
            >
              <option value="user" disabled={lastAdmin}>
                Atendente
              </option>
              <option value="admin">Admin</option>
            </select>
            {lastAdmin ? (
              <p className="text-xs text-muted-foreground">Não é possível rebaixar o último admin.</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Setor</Label>
            <select
              id="department"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.departmentId}
              onChange={(e) => onChange({ ...form, departmentId: e.target.value })}
            >
              <option value="">Sem setor</option>
              {departments
                .filter((item) => item.isActive)
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </select>
          </div>
          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => onChange({ ...form, status: e.target.value as AgentStatus })}
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit">Salvar</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
