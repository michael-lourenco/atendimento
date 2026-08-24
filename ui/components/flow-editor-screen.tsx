'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flow, FlowStep } from '@/core/entities/Flow';
import { Department } from '@/core/entities/Department';
import { FlowStepsEditor } from '@/ui/components/flow-steps-editor';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import { FlowKeywordChips } from '@/ui/components/flow-keyword-chips';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { normalizeFlowKeywords } from '@/ui/lib/flow-keywords';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { flowHasUnpublishedChanges } from '@/core/entities/flowPublish';

type FlowEditorScreenProps = {
  flowId?: string;
  fromFlowId?: string | null;
};

function snapshot(value: {
  name: string;
  description: string;
  isActive: boolean;
  keywords: string[];
  steps: FlowStep[];
}) {
  return JSON.stringify(value);
}

export function FlowEditorScreen({ flowId, fromFlowId }: FlowEditorScreenProps) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const { show, kind, message, markSaved, flashSuccess, flashError } = useCatalogSavedFlash();
  const [loading, setLoading] = useState(true);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [savedSnap, setSavedSnap] = useState('');
  const [error, setError] = useState<string | null>(null);

  const current = useMemo(
    () => snapshot({ name, description, isActive, keywords, steps }),
    [name, description, isActive, keywords, steps]
  );
  const dirty = Boolean(savedSnap) && current !== savedSnap;

  const backHref = fromFlowId
    ? `/dashboard/flows/${fromFlowId}`
    : '/dashboard/flows';

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const [allFlows, departmentList] = await Promise.all([
          clientUseCases.allFlows().execute(),
          clientUseCases.departments().list(),
        ]);
        setFlows(allFlows);
        setDepartments(departmentList);
        if (flowId) {
          const found =
            allFlows.find((item) => item.id === flowId) ??
            (await clientUseCases.flowById().execute(flowId));
          if (!found) {
            setError('Fluxo não encontrado.');
            return;
          }
          setEditing(found);
          setName(found.name);
          setDescription(found.description || '');
          setIsActive(found.isActive);
          setKeywords(normalizeFlowKeywords(found.keywords ?? []));
          setSteps(found.steps);
          setSavedSnap(
            snapshot({
              name: found.name,
              description: found.description || '',
              isActive: found.isActive,
              keywords: normalizeFlowKeywords(found.keywords ?? []),
              steps: found.steps,
            })
          );
        } else {
          const empty = snapshot({
            name: '',
            description: '',
            isActive: true,
            keywords: [],
            steps: [],
          });
          setSavedSnap(empty);
        }
      } catch {
        setError('Não foi possível carregar o fluxo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [flowId]);

  const saveFlow = useCallback(
    async (options?: { navigate?: boolean; keywordsOverride?: string[] }): Promise<Flow | null> => {
    if (!name.trim()) {
      setError('Dê um nome ao fluxo.');
      return null;
    }
    try {
      const id = editing?.id || flowId || `flow-${Date.now()}`;
      const keywordList = normalizeFlowKeywords(options?.keywordsOverride ?? keywords);
      const flow: Flow = {
        id,
        name: name.trim(),
        description,
        isActive,
        keywords: keywordList,
        steps,
        publishedSteps: editing?.publishedSteps,
        createdAt: editing?.createdAt || new Date(),
        updatedAt: new Date(),
      };
      const savedFlow = await clientUseCases.saveFlow().execute(flow);
      setEditing(savedFlow);
      setKeywords(savedFlow.keywords ?? []);
      setError(null);
      setSavedSnap(
        snapshot({
          name: savedFlow.name,
          description,
          isActive,
          keywords: savedFlow.keywords ?? [],
          steps,
        })
      );
      markSaved();
      if ((options?.navigate ?? true) && !flowId) {
        router.replace(`/dashboard/flows/${id}`);
      }
      return savedFlow;
    } catch (saveError) {
      setError(catalogPersistErrorMessage(saveError, 'flows'));
      flashError(catalogPersistErrorMessage(saveError, 'flows'));
      return null;
    }
  }, [description, editing, flowId, isActive, keywords, markSaved, flashError, name, router, steps]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveFlow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveFlow]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);

  const unpublished = flowHasUnpublishedChanges({
    steps,
    publishedSteps: editing?.publishedSteps,
  });

  const publishFlow = async () => {
    const saved = await saveFlow({ navigate: false });
    if (!saved) {
      return;
    }
    try {
      const impact = await clientUseCases.flowPublishImpact().execute(saved.id, steps);
      if (
        impact.count > 0 &&
        !(await confirm(
          `${impact.count} conversa${impact.count === 1 ? '' : 's'} estão em passos que vão sumir. Publicar mesmo assim?`
        ))
      ) {
        return;
      }
      const published = await clientUseCases.publishFlow().execute(saved.id);
      if (!published) {
        return;
      }
      setEditing(published);
      flashSuccess('Publicado');
    } catch (publishError) {
      setError(catalogPersistErrorMessage(publishError, 'flows'));
      flashError(catalogPersistErrorMessage(publishError, 'flows'));
    }
  };

  const goBack = async () => {
    if (dirty && !(await confirm('Sair sem salvar as alterações?'))) {
      return;
    }
    router.push(backHref);
  };

  const openFlow = async (targetId: string) => {
    if (dirty && !(await confirm('Há alterações não salvas. Abrir o outro fluxo mesmo assim?'))) {
      return;
    }
    const from = editing?.id || flowId;
    router.push(from ? `/dashboard/flows/${targetId}?from=${from}` : `/dashboard/flows/${targetId}`);
  };

  if (loading) {
    return <CatalogListSkeleton />;
  }

  return (
    <div className="space-y-4">
      {dialog}
      <CatalogSavedNotice show={show} kind={kind} message={message} />
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {dirty ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Alterações não salvas. Ctrl+S ou ⌘S para gravar.
        </p>
      ) : null}
      {unpublished ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          Alterações no quadro ainda não estão no WhatsApp. Publique quando o roteiro estiver ok.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => void goBack()}>
          Voltar
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void publishFlow()}>
            Publicar
          </Button>
          <Button type="button" onClick={() => void saveFlow()}>
            Salvar fluxo
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-2">
          <Label htmlFor="flow-name">Nome</Label>
          <Input id="flow-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input
            type="checkbox"
            id="flow-active"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="rounded border-border accent-accent"
          />
          <Label htmlFor="flow-active" className="cursor-pointer">
            Ativo
          </Label>
        </div>
      </div>
      <details className="rounded-md border border-border p-3">
        <summary className="cursor-pointer text-sm font-medium">
          Descrição e palavras-chave
          {keywords.length > 0 ? ` (${keywords.length})` : ''}
        </summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="flow-desc">Descrição</Label>
            <Textarea
              id="flow-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <FlowKeywordChips
            value={keywords}
            onChange={setKeywords}
            onShortcutSave={(next) => void saveFlow({ keywordsOverride: next })}
          />
        </div>
      </details>
      <FlowStepsEditor
        key={flowId || 'new'}
        steps={steps}
        departments={departments}
        flows={flows}
        currentFlowId={editing?.id || flowId}
        savedStepIds={editing?.steps.map((step) => step.id) ?? []}
        onChange={setSteps}
        onOpenFlow={(id) => void openFlow(id)}
        onEnsureSaved={async () => {
          const saved = await saveFlow({ navigate: false });
          return saved?.id ?? null;
        }}
        onPersisted={(id) => {
          if (!flowId) {
            router.replace(`/dashboard/flows/${id}`);
          }
        }}
      />
    </div>
  );
}
