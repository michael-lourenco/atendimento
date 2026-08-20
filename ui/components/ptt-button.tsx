'use client';

import { Mic } from 'lucide-react';
import { PointerEvent } from 'react';

type PttButtonProps = {
  recording: boolean;
  disabled?: boolean;
  idleLabel?: string;
  recordingLabel?: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onHoldCancel: () => void;
};

export function PttButton({
  recording,
  disabled,
  idleLabel = 'Segure para gravar áudio',
  recordingLabel = 'Solte para enviar o áudio',
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
}: PttButtonProps) {
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onHoldStart();
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    onHoldEnd();
  };

  const onPointerCancel = () => {
    onHoldCancel();
  };

  return (
    <button
      type="button"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${
        recording
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      } disabled:opacity-40`}
      aria-label={recording ? recordingLabel : idleLabel}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
