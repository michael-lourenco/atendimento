'use client';

import { Agent } from '@/core/entities/Agent';
import { canSetAgentOffline, operatorForAgent } from '@/core/entities/agentStatus';
import { canDeleteOperator } from '@/core/entities/operatorRole';
import { User } from '@/core/entities/User';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Badge } from '@/ui/components/badge';
import { EmptyState } from '@/ui/components/empty-state';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { Search } from 'lucide-react';
import { useCatalogSearchShortcut } from '@/ui/lib/use-catalog-search-shortcut';
import { useRef } from 'react';

type AgentsTableProps = {
  loading: boolean;
  agents: Agent[];
  visible: Agent[];
  operators: User[];
  actor: User | null;
  departmentName: (id?: string) => string;
  filter: string;
  onFilter: (value: string) => void;
  onCreate: () => void;
  onEdit: (agent: Agent) => void;
  onDeleteOperator: (operatorId: string) => void;
  onDeactivate: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
};

export function AgentsTable({
  loading,
  agents,
  visible,
  operators,
  actor,
  departmentName,
  filter,
  onFilter,
  onCreate,
  onEdit,
  onDeleteOperator,
  onDeactivate,
  onDeleteAgent,
}: AgentsTableProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  useCatalogSearchShortcut(searchRef);
  return (
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
              ref={searchRef}
              placeholder="Buscar atendentes..."
              aria-label="Filtrar atendentes"
              className="pl-10 w-64 bg-background"
              value={filter}
              onChange={(e) => onFilter(e.target.value)}
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
            onAction={agents.length === 0 ? onCreate : undefined}
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
                        <Button variant="outline" size="sm" onClick={() => onEdit(agent)}>
                          Editar
                        </Button>
                        {linked && actor && canDeleteOperator(actor, operators, linked.id) ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteOperator(linked.id)}
                          >
                            Excluir
                          </Button>
                        ) : linked &&
                          actor &&
                          canSetAgentOffline(actor, agent, agents, operators) ? (
                          <Button variant="outline" size="sm" onClick={() => onDeactivate(agent)}>
                            Desativar
                          </Button>
                        ) : linked ? null : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteAgent(agent)}
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
  );
}
