'use client';

import { Flow } from '@/core/entities/Flow';
import { ChatbotFormState } from '@/ui/lib/chatbot-form';
import { BusinessHoursFields } from '@/ui/components/business-hours-fields';
import { BotBehaviorFields } from '@/ui/components/bot-behavior-fields';
import { EntryFlowSelect } from '@/ui/components/entry-flow-select';

type ChatbotLineFieldsProps = {
  form: ChatbotFormState;
  flows: Flow[];
  useCompanyFlow: boolean;
  useCompanyHours: boolean;
  useCompanyRhythm: boolean;
  onChange: (next: ChatbotFormState) => void;
  onUseCompanyFlow: (useCompany: boolean) => void;
  onUseCompanyHours: (useCompany: boolean) => void;
  onUseCompanyRhythm: (useCompany: boolean) => void;
};

export function ChatbotLineFields({
  form,
  flows,
  useCompanyFlow,
  useCompanyHours,
  useCompanyRhythm,
  onChange,
  onUseCompanyFlow,
  onUseCompanyHours,
  onUseCompanyRhythm,
}: ChatbotLineFieldsProps) {
  return (
    <>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useCompanyFlow}
          onChange={(event) => onUseCompanyFlow(event.target.checked)}
        />
        Usar o fluxo da empresa nesta linha
      </label>
      {useCompanyFlow ? (
        <p className="text-sm text-muted-foreground">Esta linha herda o roteiro de entrada da empresa.</p>
      ) : (
        <EntryFlowSelect
          id="line-entry-flow"
          value={form.flowId}
          flows={flows}
          hint="Contato novo nesta linha começa neste roteiro."
          onChange={(flowId) => onChange({ ...form, flowId })}
        />
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useCompanyHours}
          onChange={(event) => onUseCompanyHours(event.target.checked)}
        />
        Usar o expediente da empresa nesta linha
      </label>
      {useCompanyHours ? (
        <p className="text-sm text-muted-foreground">Esta linha herda dias, horário e aviso fora do expediente.</p>
      ) : (
        <BusinessHoursFields value={form.hours} onChange={(hours) => onChange({ ...form, hours })} />
      )}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useCompanyRhythm}
          onChange={(event) => onUseCompanyRhythm(event.target.checked)}
        />
        Usar o ritmo da empresa nesta linha
      </label>
      {useCompanyRhythm ? (
        <p className="text-sm text-muted-foreground">Esta linha herda espera, digitando e silêncio da empresa.</p>
      ) : (
        <BotBehaviorFields
          value={form.behavior}
          onChange={(behavior) => onChange({ ...form, behavior })}
        />
      )}
    </>
  );
}
