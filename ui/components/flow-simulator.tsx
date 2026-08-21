'use client';

import { Flow, FlowStep } from '@/core/entities/Flow';
import { FlowAudience } from '@/core/entities/flowAudience';
import { FlowSession } from '@/core/entities/FlowSession';
import { previewFlowTurn, simulateFlowIncoming } from '@/core/engine/previewFlowOpening';
import { FlowReply } from '@/core/engine/planFlowTurn';
import { Button } from '@/ui/components/button';
import { FlowSimBubble } from '@/ui/components/flow-sim-bubble';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { FlowSimCursor } from '@/ui/lib/flow-sim-canvas';
import { useLayoutEffect, useMemo, useState } from 'react';

type Bubble = {
  direction: 'in' | 'out';
  text: string;
  flowId?: string;
  stepId?: string;
  mediaUrl?: string;
  mediaKind?: 'image' | 'audio';
};

type FlowSimulatorProps = {
  steps: FlowStep[];
  flows?: Flow[];
  flowId?: string;
  onCursor?: (cursor: FlowSimCursor) => void;
};

function outgoingBubbles(replies: FlowReply[]): Bubble[] {
  return replies.map((reply) => ({
    direction: 'out' as const,
    text: reply.content,
    flowId: reply.flowId,
    stepId: reply.stepId,
    mediaUrl: reply.mediaUrl,
    mediaKind: reply.mediaKind,
  }));
}

function lastOutgoingStepId(bubbles: Bubble[]): string | null {
  for (let index = bubbles.length - 1; index >= 0; index -= 1) {
    const bubble = bubbles[index];
    if (bubble.direction === 'out' && bubble.stepId) {
      return bubble.stepId;
    }
  }
  return null;
}

export function FlowSimulator({
  steps,
  flows = [],
  flowId = 'preview',
  onCursor,
}: FlowSimulatorProps) {
  const now = useMemo(() => new Date(0), []);
  const [audience, setAudience] = useState<FlowAudience>('new');
  const start = useMemo(
    () => previewFlowTurn(steps, now, flows, audience, flowId),
    [steps, flows, flowId, now, audience]
  );
  const [session, setSession] = useState<FlowSession | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[] | null>(null);
  const [text, setText] = useState('');

  const visible = bubbles ?? outgoingBubbles(start.replies);
  const currentSession = bubbles ? session : start.nextSession;
  const cursorFlowId = currentSession?.flowId ?? flowId;
  const cursorStepId = currentSession?.currentStepId ?? lastOutgoingStepId(visible);

  useLayoutEffect(() => {
    onCursor?.({ flowId: cursorFlowId, stepId: cursorStepId });
  }, [cursorFlowId, cursorStepId, onCursor]);

  const restart = (nextAudience = audience) => {
    setAudience(nextAudience);
    setBubbles(null);
    setSession(null);
    setText('');
  };

  const send = () => {
    const incoming = text.trim();
    const turn = simulateFlowIncoming({
      steps,
      catalog: flows,
      flowId,
      session: currentSession,
      incomingText: incoming,
      now,
    });
    if (!turn) {
      return;
    }
    setBubbles([
      ...visible,
      { direction: 'in', text: incoming },
      ...outgoingBubbles(turn.replies),
    ]);
    setSession(turn.nextSession);
    setText('');
  };

  return (
    <div className="space-y-2 rounded-md border border-border bg-chat p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">Simular conversa</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => restart()}>
          Recomeçar
        </Button>
      </div>
      <div className="space-y-1">
        <Label htmlFor="sim-audience" className="text-xs text-muted-foreground">
          Contato
        </Label>
        <select
          id="sim-audience"
          className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={audience}
          onChange={(event) => restart(event.target.value as FlowAudience)}
        >
          <option value="new">Novo</option>
          <option value="known">Conhecido</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Novo recebe a saudação. Conhecido começa no menu.
        </p>
      </div>
      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">Adicione um bloco para simular.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {visible.map((bubble, index) => (
            <FlowSimBubble key={`${index}-${bubble.text.slice(0, 20)}`} {...bubble} />
          ))}
          {currentSession?.paused ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Passou para o time. O bot não responde. Recomeçar para simular de novo.
            </p>
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
