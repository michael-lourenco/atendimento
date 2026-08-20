'use client';

import { BotBehavior, DEFAULT_BOT_BEHAVIOR, mergeBotBehavior } from '@/core/entities/botBehavior';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Textarea } from '@/ui/components/textarea';

type BotBehaviorFieldsProps = {
  value: BotBehavior;
  onChange: (next: BotBehavior) => void;
};

export function BotBehaviorFields({ value, onChange }: BotBehaviorFieldsProps) {
  const patch = (partial: Partial<BotBehavior>) => onChange(mergeBotBehavior({ ...value, ...partial }));
  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Comportamento no WhatsApp</summary>
      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Espera antes da 1ª mensagem (ms)</Label>
            <Input
              type="number"
              min={0}
              max={5000}
              value={value.replyDelayMs}
              onChange={(event) => patch({ replyDelayMs: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Espera entre mensagens (ms)</Label>
            <Input
              type="number"
              min={0}
              max={8000}
              value={value.bubbleDelayMs}
              onChange={(event) => patch({ bubbleDelayMs: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Debounce do incoming (ms)</Label>
            <Input
              type="number"
              min={0}
              max={3000}
              value={value.inboundDebounceMs}
              onChange={(event) => patch({ inboundDebounceMs: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Margem após digitando (ms)</Label>
            <Input
              type="number"
              min={0}
              max={5000}
              value={value.typingIdleMs}
              onChange={(event) => patch({ typingIdleMs: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Silêncio na pergunta (minutos)</Label>
            <Input
              type="number"
              min={0}
              max={1440}
              value={value.idleContactMinutes}
              onChange={(event) => patch({ idleContactMinutes: Number(event.target.value) })}
            />
            <p className="text-xs text-muted-foreground">0 desliga. Só vale enquanto o bot espera resposta.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.sendComposing}
            onChange={(event) => patch({ sendComposing: event.target.checked })}
          />
          Mostrar “digitando…” no delay
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
          <Label>Aviso ao encerrar por silêncio</Label>
          <Textarea
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
