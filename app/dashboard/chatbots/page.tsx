'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useMemo, useState } from 'react';
import { Chatbot } from '@/core/entities/Chatbot';
import { Flow } from '@/core/entities/Flow';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { companyChatbot, extraChatbots } from '@/core/entities/chatbotActive';
import { resolveBotBehavior } from '@/core/entities/botBehavior';
import { syncBusinessHoursLegacy } from '@/core/entities/businessHours';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import Link from 'next/link';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { CatalogSaveButton } from '@/ui/components/catalog-save-button';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';
import { invalidateWhatsAppNumberCache } from '@/ui/lib/whatsapp-number-cache';
import { ChatbotCompanyFields } from '@/ui/components/chatbot-company-fields';
import { ChatbotLineFields } from '@/ui/components/chatbot-line-fields';
import { chatbotFormFrom, emptyChatbotForm } from '@/ui/lib/chatbot-form';
import {
  CHATBOT_SCOPE_SWITCH_CONFIRM,
  ChatbotScopeDraft,
  chatbotDraftIsDirty,
  chatbotDraftSnapshot,
  chatbotScopeDraft,
} from '@/ui/lib/chatbot-draft';

const botsCatalog = clientUseCases.chatbots;
const numbersCatalog = clientUseCases.whatsAppNumbers;

export default function ChatbotsPage() {
  const [bots, setBots] = useState<Chatbot[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [scope, setScope] = useState('company');
  const [useCompanyRhythm, setUseCompanyRhythm] = useState(true);
  const [useCompanyFlow, setUseCompanyFlow] = useState(true);
  const [useCompanyHours, setUseCompanyHours] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyChatbotForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedSnap, setSavedSnap] = useState('');
  const { confirm, dialog } = useConfirm();
  const { show, saving, kind, message, beginSave, markSaved, flashError } = useCatalogSavedFlash();
  const extras = extraChatbots(bots);
  const line = numbers.find((item) => item.id === scope);
  const currentDraft = useMemo(
    () => ({ scope, form, useCompanyRhythm, useCompanyFlow, useCompanyHours }),
    [scope, form, useCompanyRhythm, useCompanyFlow, useCompanyHours]
  );
  const dirty = chatbotDraftIsDirty(savedSnap, currentDraft);

  const applyDraft = (draft: ChatbotScopeDraft) => {
    setScope(draft.scope);
    setForm(draft.form);
    setUseCompanyRhythm(draft.useCompanyRhythm);
    setUseCompanyFlow(draft.useCompanyFlow);
    setUseCompanyHours(draft.useCompanyHours);
    setSavedSnap(chatbotDraftSnapshot(draft));
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
      applyDraft(chatbotScopeDraft(nextScope, list, lines, flowList));
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
    beginSave();
    try {
      if (scope !== 'company' && line) {
        await numbersCatalog().save({
          ...line,
          behavior: useCompanyRhythm ? undefined : form.behavior,
          flowId: useCompanyFlow ? undefined : form.flowId.trim() || undefined,
          businessHours: useCompanyHours ? undefined : syncBusinessHoursLegacy(form.hours),
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
      const text = catalogPersistErrorMessage(
        cause,
        scope === 'company' ? 'chatbots' : 'whatsapp_numbers'
      );
      setError(text);
      flashError(text);
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
      <CatalogSavedNotice show={show} kind={kind} message={message} />
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <p className="mb-6 text-muted-foreground">
        O roteiro mora em{' '}
        <Link href="/dashboard/flows" className="underline">
          Fluxos
        </Link>
        . Aqui você só diz qual é o de entrada, o expediente e o ritmo.{' '}
        Só o bot <strong>ativo</strong> vale no WhatsApp.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {scope === 'company' ? 'Chatbot da empresa' : `Linha: ${line?.name ?? 'linha'}`}
          </CardTitle>
          <CardDescription>
            {scope === 'company'
              ? 'Fluxo de entrada, expediente e ritmo padrão. Cada linha pode ter os seus.'
              : 'Fluxo, expediente e ritmo desta linha.'}
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
                  onChange={(event) => {
                    const next = event.target.value;
                    if (next === scope) {
                      return;
                    }
                    void (async () => {
                      if (dirty && !(await confirm(CHATBOT_SCOPE_SWITCH_CONFIRM))) {
                        return;
                      }
                      applyDraft(chatbotScopeDraft(next, bots, numbers, flows));
                    })();
                  }}
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
              <ChatbotLineFields
                form={form}
                flows={flows}
                useCompanyFlow={useCompanyFlow}
                useCompanyHours={useCompanyHours}
                useCompanyRhythm={useCompanyRhythm}
                onChange={setForm}
                onUseCompanyFlow={(useCompany) => {
                  setUseCompanyFlow(useCompany);
                  if (useCompany) {
                    const main = companyChatbot(bots);
                    setForm({
                      ...form,
                      flowId: main ? chatbotFormFrom(main, flows).flowId : form.flowId,
                    });
                  }
                }}
                onUseCompanyHours={(useCompany) => {
                  setUseCompanyHours(useCompany);
                  if (useCompany) {
                    const main = companyChatbot(bots);
                    setForm({
                      ...form,
                      hours: main ? chatbotFormFrom(main, flows).hours : form.hours,
                    });
                  }
                }}
                onUseCompanyRhythm={(useCompany) => {
                  setUseCompanyRhythm(useCompany);
                  if (useCompany) {
                    setForm({ ...form, behavior: resolveBotBehavior(bots) });
                  }
                }}
              />
            )}
            <CatalogSaveButton flash={{ saving, show, kind, message }} />
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
