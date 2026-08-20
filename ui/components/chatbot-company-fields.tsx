'use client';

import { Flow } from '@/core/entities/Flow';
import { ChatbotFormState, entryFlowChoices } from '@/ui/lib/chatbot-form';
import { BotBehaviorFields } from '@/ui/components/bot-behavior-fields';
import { BusinessHoursFields } from '@/ui/components/business-hours-fields';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';
import Link from 'next/link';

type ChatbotCompanyFieldsProps = {
  form: ChatbotFormState;
  flows: Flow[];
  onChange: (next: ChatbotFormState) => void;
};

export function ChatbotCompanyFields({ form, flows, onChange }: ChatbotCompanyFieldsProps) {
  const choices = entryFlowChoices(flows, form.flowId);
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          required
          className="bg-background"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          className="bg-background"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(event) => onChange({ ...form, isActive: event.target.checked })}
        />
        Ativo (desligado = o WhatsApp não responde sozinho)
      </label>
      <div className="space-y-1">
        <Label htmlFor="entry-flow">Fluxo de entrada</Label>
        <select
          id="entry-flow"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.flowId}
          onChange={(event) => onChange({ ...form, flowId: event.target.value })}
        >
          {choices.length === 0 ? <option value="">Nenhum fluxo ativo</option> : null}
          {choices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.isActive ? '' : ' (inativo)'}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Contato novo começa neste roteiro.{' '}
          <Link href="/dashboard/flows" className="underline">
            Abrir Fluxos
          </Link>
        </p>
      </div>
      <BusinessHoursFields value={form.hours} onChange={(hours) => onChange({ ...form, hours })} />
      <BotBehaviorFields
        value={form.behavior}
        onChange={(behavior) => onChange({ ...form, behavior })}
      />
    </>
  );
}
