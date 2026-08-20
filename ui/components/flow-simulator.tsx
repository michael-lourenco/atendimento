'use client';

import { Flow, FlowStep } from '@/core/entities/Flow';
import { FlowSession } from '@/core/entities/FlowSession';
import { planFlowTurn } from '@/core/engine/planFlowTurn';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { useMemo, useState } from 'react';

type Bubble = { direction: 'in' | 'out'; text: string };

type FlowSimulatorProps = {
  steps: FlowStep[];
  flows?: Flow[];
  flowId?: string;
};

function previewFlow(steps: FlowStep[], flowId: string, now: Date): Flow {
  return {
    id: flowId,
    name: 'preview',
    isActive: true,
    steps,
    createdAt: now,
    updatedAt: now,
  };
}

function opening(steps: FlowStep[], flows: Flow[], flowId: string, now: Date) {
  const flow = previewFlow(steps, flowId, now);
  const plan = planFlowTurn({
    flow,
    flows: [flow, ...flows.filter((item) => item.id !== flowId)],
    session: null,
    contactId: 'preview',
    incomingText: 'oi',
    now,
  });
  return {
    bubbles: plan.replies.map((reply) => ({ direction: 'out' as const, text: reply.content })),
    session: plan.nextSession,
  };
}

export function FlowSimulator({ steps, flows = [], flowId = 'preview' }: FlowSimulatorProps) {
  const now = useMemo(() => new Date(0), []);
  const start = useMemo(() => opening(steps, flows, flowId, now), [steps, flows, flowId, now]);
  const [session, setSession] = useState<FlowSession | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[] | null>(null);
  const [text, setText] = useState('');

  const visible = bubbles ?? start.bubbles;
  const currentSession = bubbles ? session : start.session;

  const send = () => {
    const incoming = text.trim();
    if (!incoming || steps.length === 0) {
      return;
    }
    const flow = previewFlow(steps, flowId, now);
    const plan = planFlowTurn({
      flow,
      flows: [flow, ...flows.filter((item) => item.id !== flowId)],
      session: currentSession,
      contactId: 'preview',
      incomingText: incoming,
      now,
    });
    setBubbles([
      ...visible,
      { direction: 'in', text: incoming },
      ...plan.replies.map((reply) => ({ direction: 'out' as const, text: reply.content })),
    ]);
    setSession(plan.nextSession);
    setText('');
  };

  return (
    <div className="space-y-2 rounded-md border border-border bg-chat p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Simular conversa</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setBubbles(null);
            setSession(null);
            setText('');
          }}
        >
          Recomeçar
        </Button>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">Adicione um bloco para simular.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {visible.map((bubble, index) => (
            <div
              key={`${index}-${bubble.text.slice(0, 20)}`}
              className={
                bubble.direction === 'out'
                  ? 'ml-8 whitespace-pre-wrap rounded-lg bg-bubble-out px-3 py-2 text-sm text-bubble-out-foreground shadow-sm'
                  : 'mr-8 whitespace-pre-wrap rounded-lg bg-bubble-in px-3 py-2 text-sm text-bubble-in-foreground shadow-sm'
              }
            >
              {bubble.text}
            </div>
          ))}
          {currentSession?.paused ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">Passou para o time.</p>
          ) : null}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={text}
          placeholder="O cliente digitou…"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <Button type="button" size="sm" onClick={send}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
