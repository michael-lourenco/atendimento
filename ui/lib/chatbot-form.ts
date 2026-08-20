import { Chatbot } from '@/core/entities/Chatbot';
import { Flow } from '@/core/entities/Flow';
import { BotBehavior, mergeBotBehavior } from '@/core/entities/botBehavior';
import { BusinessHours } from '@/core/entities/businessHours';
import { resolveActiveFlow } from '@/core/engine/resolveActiveFlow';
import { DEFAULT_BOT_BEHAVIOR } from '@/ui/components/bot-behavior-fields';
import { DEFAULT_BUSINESS_HOURS } from '@/ui/components/business-hours-fields';

export type ChatbotFormState = {
  name: string;
  description: string;
  isActive: boolean;
  flowId: string;
  hours: BusinessHours;
  behavior: BotBehavior;
};

export const emptyChatbotForm: ChatbotFormState = {
  name: 'Atendimento',
  description: '',
  isActive: true,
  flowId: '',
  hours: DEFAULT_BUSINESS_HOURS,
  behavior: DEFAULT_BOT_BEHAVIOR,
};

export function chatbotFormFrom(bot: Chatbot, flows: Flow[] = []): ChatbotFormState {
  return {
    name: bot.name,
    description: bot.description || '',
    isActive: bot.isActive,
    flowId: bot.flowId || resolveActiveFlow(flows)?.id || '',
    hours: bot.businessHours ?? DEFAULT_BUSINESS_HOURS,
    behavior: mergeBotBehavior(bot.behavior),
  };
}

export function entryFlowChoices(flows: Flow[], selectedId: string): Flow[] {
  const active = flows.filter((item) => item.isActive);
  const selected = flows.find((item) => item.id === selectedId);
  if (selected && !active.some((item) => item.id === selected.id)) {
    return [selected, ...active];
  }
  return active;
}
