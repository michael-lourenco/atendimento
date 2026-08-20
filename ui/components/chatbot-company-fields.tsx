'use client';

import { Flow } from '@/core/entities/Flow';
import { ChatbotFormState } from '@/ui/lib/chatbot-form';
import { BotBehaviorFields } from '@/ui/components/bot-behavior-fields';
import { BusinessHoursFields } from '@/ui/components/business-hours-fields';
import { EntryFlowSelect } from '@/ui/components/entry-flow-select';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

type ChatbotCompanyFieldsProps = {
  form: ChatbotFormState;
  flows: Flow[];
  onChange: (next: ChatbotFormState) => void;
};

export function ChatbotCompanyFields({ form, flows, onChange }: ChatbotCompanyFieldsProps) {
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
      <EntryFlowSelect
        value={form.flowId}
        flows={flows}
        hint="Contato novo nesta empresa começa neste roteiro."
        onChange={(flowId) => onChange({ ...form, flowId })}
      />
      <BusinessHoursFields value={form.hours} onChange={(hours) => onChange({ ...form, hours })} />
      <BotBehaviorFields
        value={form.behavior}
        onChange={(behavior) => onChange({ ...form, behavior })}
      />
    </>
  );
}
