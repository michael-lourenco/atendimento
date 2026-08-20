'use client';

import { BotBehavior, DEFAULT_BOT_BEHAVIOR, mergeBotBehavior, msToSeconds, secondsToMs } from '@/core/entities/botBehavior';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

type BotBehaviorFieldsProps = {
  value: BotBehavior;
  onChange: (next: BotBehavior) => void;
};

function SecondsInput(props: {
  id: string;
  label: string;
  hint?: string;
  maxSeconds: number;
  valueMs: number;
  fallbackMs: number;
  onMs: (ms: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type="number"
        min={0}
        max={props.maxSeconds}
        step={0.1}
        value={msToSeconds(props.valueMs)}
        onChange={(event) => props.onMs(secondsToMs(event.target.value, props.fallbackMs))}
      />
      {props.hint ? <p className="text-xs text-muted-foreground">{props.hint}</p> : null}
    </div>
  );
}

export function BotBehaviorFields({ value, onChange }: BotBehaviorFieldsProps) {
  const patch = (partial: Partial<BotBehavior>) => onChange(mergeBotBehavior({ ...value, ...partial }));
  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Comportamento no WhatsApp</summary>
      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <SecondsInput
            id="reply-delay"
            label="Espera antes da 1ª mensagem (segundos)"
            maxSeconds={5}
            valueMs={value.replyDelayMs}
            fallbackMs={DEFAULT_BOT_BEHAVIOR.replyDelayMs}
            onMs={(replyDelayMs) => patch({ replyDelayMs })}
          />
          <SecondsInput
            id="bubble-delay"
            label="Espera entre mensagens (segundos)"
            maxSeconds={8}
            valueMs={value.bubbleDelayMs}
            fallbackMs={DEFAULT_BOT_BEHAVIOR.bubbleDelayMs}
            onMs={(bubbleDelayMs) => patch({ bubbleDelayMs })}
          />
          <SecondsInput
            id="inbound-debounce"
            label="Espera se o cliente mandar várias mensagens (segundos)"
            hint="Usa só a última mensagem desse intervalo."
            maxSeconds={3}
            valueMs={value.inboundDebounceMs}
            fallbackMs={DEFAULT_BOT_BEHAVIOR.inboundDebounceMs}
            onMs={(inboundDebounceMs) => patch({ inboundDebounceMs })}
          />
          <SecondsInput
            id="typing-idle"
            label="Espera depois que o cliente para de digitar (segundos)"
            maxSeconds={5}
            valueMs={value.typingIdleMs}
            fallbackMs={DEFAULT_BOT_BEHAVIOR.typingIdleMs}
            onMs={(typingIdleMs) => patch({ typingIdleMs })}
          />
          <div className="space-y-1">
            <Label htmlFor="idle-minutes">Silêncio na pergunta (minutos)</Label>
            <Input
              id="idle-minutes"
              type="number"
              min={0}
              max={1440}
              value={value.idleContactMinutes}
              onChange={(event) => patch({ idleContactMinutes: Number(event.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              0 desliga. Só vale enquanto o bot espera uma resposta. Com atendente na conversa, não encerra.
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.sendComposing}
            onChange={(event) => patch({ sendComposing: event.target.checked })}
          />
          Mostrar “digitando…” enquanto espera
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.waitWhileTyping}
            onChange={(event) => patch({ waitWhileTyping: event.target.checked })}
          />
          Esperar o contato terminar de digitar
        </label>
        <div className="space-y-1">
          <Label htmlFor="idle-close">Aviso ao encerrar por silêncio</Label>
          <Textarea
            id="idle-close"
            rows={2}
            value={value.idleCloseMessage}
            onChange={(event) => patch({ idleCloseMessage: event.target.value })}
          />
        </div>
      </div>
    </details>
  );
}

export { DEFAULT_BOT_BEHAVIOR };
