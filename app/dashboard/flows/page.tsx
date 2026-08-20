'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flow } from '@/core/entities/Flow';
import { duplicateFlow } from '@/core/entities/duplicateFlow';
import { companyChatbotFlowId } from '@/core/entities/chatbotActive';
import { resolveActiveFlow } from '@/core/engine/resolveActiveFlow';
import { EmptyState } from '@/ui/components/empty-state';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { Button } from '@/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Badge } from '@/ui/components/badge';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';

export default function FlowsPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [entryFlowId, setEntryFlowId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const { confirm, dialog } = useConfirm();
  const { show, markSaved } = useCatalogSavedFlash();
  const [error, setError] = useState<string | null>(null);

  const loadFlows = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      setFlows(await clientUseCases.allFlows().execute());
      try {
        setEntryFlowId(companyChatbotFlowId(await clientUseCases.chatbots().list()));
      } catch {
        setEntryFlowId(undefined);
      }
    } catch (loadError) {
      console.error('Erro ao carregar fluxos:', loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFlows(true);
  }, []);

  const handleDelete = async (id: string) => {
    if (!(await confirm('Excluir este fluxo?'))) {
      return;
    }
    try {
      await clientUseCases.deleteFlow().execute(id);
      setError(null);
      loadFlows();
    } catch (deleteError) {
      console.error('Erro ao excluir fluxo:', deleteError);
      setError(catalogPersistErrorMessage(deleteError, 'flows'));
    }
  };

  const handleDuplicate = async (flow: Flow) => {
    try {
      await clientUseCases.saveFlow().execute(duplicateFlow(flow));
      markSaved();
      loadFlows();
    } catch (dupError) {
      console.error('Erro ao duplicar fluxo:', dupError);
      setError(catalogPersistErrorMessage(dupError, 'flows'));
    }
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
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          O roteiro que o chatbot envia no WhatsApp. O selo marca o fluxo de entrada (Chatbots).
        </p>
        <Button onClick={() => router.push('/dashboard/flows/new')}>Novo Fluxo</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fluxos</CardTitle>
          <CardDescription>O selo WhatsApp indica o fluxo de entrada escolhido em Chatbots</CardDescription>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <EmptyState
              title="Nenhum fluxo cadastrado"
              description="Crie o Atendimento Inicial: o cliente recebe as mensagens nesta ordem no WhatsApp."
              actionLabel="Novo fluxo"
              onAction={() => router.push('/dashboard/flows/new')}
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
                      {resolveActiveFlow(flows, { entryFlowId })?.id === flow.id ? (
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
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/flows/${flow.id}`)}
                        >
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleDuplicate(flow)}>
                          Duplicar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(flow.id)}>
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
