import { Chatbot } from '@/core/entities/Chatbot';
import { Flow } from '@/core/entities/Flow';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { companyChatbot } from '@/core/entities/chatbotActive';
import { hasCustomLineBehavior, resolveBotBehavior } from '@/core/entities/botBehavior';
import { hasCustomLineHours } from '@/core/entities/businessHours';
import { resolveActiveFlow } from '@/core/engine/resolveActiveFlow';
import { ChatbotFormState, chatbotFormFrom, emptyChatbotForm } from '@/ui/lib/chatbot-form';

export type ChatbotScopeDraft = {
  scope: string;
  form: ChatbotFormState;
  useCompanyRhythm: boolean;
  useCompanyFlow: boolean;
  useCompanyHours: boolean;
};

export const CHATBOT_SCOPE_SWITCH_CONFIRM =
  'Há alterações não salvas. Trocar o Vale para mesmo assim?';

export function chatbotScopeDraft(
  nextScope: string,
  list: Chatbot[],
  lines: WhatsAppNumber[],
  flowList: Flow[]
): ChatbotScopeDraft {
  const main = companyChatbot(list);
  if (nextScope === 'company') {
    return {
      scope: nextScope,
      useCompanyRhythm: true,
      useCompanyFlow: true,
      useCompanyHours: true,
      form: main
        ? chatbotFormFrom(main, flowList)
        : { ...emptyChatbotForm, flowId: resolveActiveFlow(flowList)?.id || '' },
    };
  }
  const selected = lines.find((item) => item.id === nextScope);
  const companyForm = main ? chatbotFormFrom(main, flowList) : emptyChatbotForm;
  return {
    scope: nextScope,
    useCompanyRhythm: !hasCustomLineBehavior(selected?.behavior),
    useCompanyFlow: !selected?.flowId,
    useCompanyHours: !hasCustomLineHours(selected?.businessHours),
    form: {
      ...companyForm,
      flowId: selected?.flowId || companyForm.flowId,
      hours: selected?.businessHours ?? companyForm.hours,
      behavior: resolveBotBehavior(list, selected?.behavior),
    },
  };
}

export function chatbotDraftSnapshot(draft: ChatbotScopeDraft): string {
  return JSON.stringify(draft);
}

export function chatbotDraftIsDirty(saved: string, current: ChatbotScopeDraft): boolean {
  return Boolean(saved) && chatbotDraftSnapshot(current) !== saved;
}
