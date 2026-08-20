'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useState } from 'react';
import { Chatbot } from '@/core/entities/Chatbot';
import { Flow } from '@/core/entities/Flow';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { companyChatbot, extraChatbots } from '@/core/entities/chatbotActive';
import { hasCustomLineBehavior, resolveBotBehavior } from '@/core/entities/botBehavior';
import { syncBusinessHoursLegacy } from '@/core/entities/businessHours';
import { resolveActiveFlow } from '@/core/engine/resolveActiveFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import Link from 'next/link';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { invalidateWhatsAppNumberCache } from '@/ui/lib/whatsapp-number-cache';
import { ChatbotCompanyFields } from '@/ui/components/chatbot-company-fields';
import { BotBehaviorFields } from '@/ui/components/bot-behavior-fields';
import { chatbotFormFrom, emptyChatbotForm } from '@/ui/lib/chatbot-form';

const botsCatalog = clientUseCases.chatbots;
const numbersCatalog = clientUseCases.whatsAppNumbers;

export default function ChatbotsPage() {
  const [bots, setBots] = useState<Chatbot[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [scope, setScope] = useState('company');
  const [useCompanyRhythm, setUseCompanyRhythm] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyChatbotForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  const { show, markSaved } = useCatalogSavedFlash();
  const extras = extraChatbots(bots);
  const line = numbers.find((item) => item.id === scope);

  const applyScope = (
    nextScope: string,
    list: Chatbot[],
    lines: WhatsAppNumber[],
    flowList: Flow[]
  ) => {
    setScope(nextScope);
    const main = companyChatbot(list);
    if (nextScope === 'company') {
      setUseCompanyRhythm(true);
      setForm(
        main
          ? chatbotFormFrom(main, flowList)
          : { ...emptyChatbotForm, flowId: resolveActiveFlow(flowList)?.id || '' }
      );
      return;
    }
    const selected = lines.find((item) => item.id === nextScope);
    const custom = hasCustomLineBehavior(selected?.behavior);
    setUseCompanyRhythm(!custom);
    setForm({
      ...(main ? chatbotFormFrom(main, flowList) : emptyChatbotForm),
      behavior: resolveBotBehavior(list, selected?.behavior),
    });
  };

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [list, lines, flowList] = await Promise.all([
        botsCatalog().list(),
        numbersCatalog().list(),
        clientUseCases.allFlows().execute(),
      ]);
      setBots(list);
      setNumbers(lines);
      setFlows(flowList);
      const main = companyChatbot(list);
      setEditingId(main?.id ?? null);
      const nextScope =
        scope === 'company' || lines.some((item) => item.id === scope) ? scope : 'company';
      applyScope(nextScope, list, lines, flowList);
      setError(null);
    } catch (cause) {
      setError(catalogPersistErrorMessage(cause, 'chatbots'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    try {
      if (scope !== 'company' && line) {
        await numbersCatalog().save({
          ...line,
          behavior: useCompanyRhythm ? undefined : form.behavior,
        });
        invalidateWhatsAppNumberCache();
      } else {
        const current = editingId ? bots.find((item) => item.id === editingId) : undefined;
        await botsCatalog().save({
          id: editingId || `bot-${Date.now()}`,
          name: form.name,
          description: form.description,
          isActive: form.isActive,
          flowId: form.flowId.trim() || undefined,
          messagesCount: current?.messagesCount || 0,
          businessHours: syncBusinessHoursLegacy(form.hours),
          behavior: form.behavior,
          createdAt: current?.createdAt || now,
          updatedAt: now,
        });
      }
      markSaved();
      await load();
    } catch (cause) {
      setError(
        catalogPersistErrorMessage(cause, scope === 'company' ? 'chatbots' : 'whatsapp_numbers')
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm('Excluir este cadastro extra?'))) {
      return;
    }
    try {
      await botsCatalog().delete(id);
      await load();
    } catch (cause) {
      setError(catalogPersistErrorMessage(cause, 'chatbots'));
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <p className="text-muted-foreground">Fluxo de entrada, expediente e ritmo do WhatsApp.</p>
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
      <p className="mb-6 text-muted-foreground">
        Só o bot <strong>ativo</strong> vale no WhatsApp.{' '}
        <Link href="/dashboard/flows" className="underline">
          Abrir Fluxos
        </Link>
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{scope === 'company' ? 'Chatbot da empresa' : `Ritmo: ${line?.name ?? 'linha'}`}</CardTitle>
          <CardDescription>
            {scope === 'company'
              ? 'Fluxo de entrada, expediente e ritmo padrão. Cada linha pode ter um ritmo próprio.'
              : 'Só o ritmo desta linha. Fluxo e expediente continuam os da empresa.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {numbers.length > 0 ? (
              <div className="space-y-1">
                <Label htmlFor="scope">Vale para</Label>
                <select
                  id="scope"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={scope}
                  onChange={(event) => applyScope(event.target.value, bots, numbers, flows)}
                >
                  <option value="company">Empresa (padrão)</option>
                  {numbers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {scope === 'company' ? (
              <ChatbotCompanyFields form={form} flows={flows} onChange={setForm} />
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useCompanyRhythm}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setUseCompanyRhythm(checked);
                      if (checked) {
                        setForm({ ...form, behavior: resolveBotBehavior(bots) });
                      }
                    }}
                  />
                  Usar o ritmo da empresa nesta linha
                </label>
                {useCompanyRhythm ? (
                  <p className="text-sm text-muted-foreground">
                    Esta linha herda espera, digitando e silêncio da empresa.
                  </p>
                ) : (
                  <BotBehaviorFields
                    value={form.behavior}
                    onChange={(behavior) => setForm({ ...form, behavior })}
                  />
                )}
              </>
            )}
            <Button type="submit">Salvar</Button>
          </form>
        </CardContent>
      </Card>

      {extras.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Cadastros extras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {extras.map((bot) => (
              <div
                key={bot.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm">{bot.name}</span>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(bot.id)}>
                  Excluir
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
