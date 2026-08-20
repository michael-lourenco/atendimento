import { FlowStep } from '@/core/entities/Flow';
import { isClosedTab, isWaitingTab } from '@/core/entities/conversationTabs';

export type QueueTone = 'incoming' | 'waiting' | 'closed';
export type OnOffTone = 'success' | 'muted';

export function queueToneOf(conversation: {
  status: string;
  assignedAgentId?: string;
}): QueueTone {
  if (isClosedTab(conversation)) return 'closed';
  if (isWaitingTab(conversation)) return 'waiting';
  return 'incoming';
}

export function onOffTone(active: boolean): OnOffTone {
  return active ? 'success' : 'muted';
}

export const queueToneBar: Record<QueueTone, string> = {
  incoming: 'bg-amber-500',
  waiting: 'bg-sky-500',
  closed: 'bg-muted-foreground/40',
};

export const queueTabActiveClass: Record<QueueTone, string> = {
  incoming:
    'data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-900 dark:data-[state=active]:text-amber-200',
  waiting:
    'data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-900 dark:data-[state=active]:text-sky-200',
  closed: 'data-[state=active]:bg-background data-[state=active]:text-muted-foreground',
};

export const flowStepToneBar: Record<FlowStep['type'], string> = {
  message: 'border-l-sky-500',
  question: 'border-l-amber-500',
  condition: 'border-l-violet-500',
  action: 'border-l-emerald-500',
};

export const flowCanvasNodeBorder: Record<string, string> = {
  message: 'border-sky-500',
  question: 'border-amber-500',
  condition: 'border-violet-500',
  action: 'border-emerald-500',
  goToFlow: 'border-sky-400',
  handoff: 'border-amber-600',
};

export const flowPaletteChipFill: Record<string, string> = {
  message: 'bg-sky-500/15',
  question: 'bg-amber-500/15',
  condition: 'bg-violet-500/15',
  action: 'bg-emerald-500/15',
  goToFlow: 'bg-sky-400/15',
  handoff: 'bg-amber-600/15',
};

export const flowPathLabelClass: Record<string, string> = {
  'Se sim': 'text-emerald-700 dark:text-emerald-400',
  'Se não': 'text-amber-700 dark:text-amber-400',
  Depois: 'text-muted-foreground',
  Salta: 'text-sky-700 dark:text-sky-400',
};
