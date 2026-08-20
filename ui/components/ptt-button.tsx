'use client';

import { Mic } from 'lucide-react';
import { PointerEvent, useRef, useState } from 'react';
import { pttHoldShouldCancel } from '@/ui/lib/ptt-slide-cancel';

type PttButtonProps = {
  recording: boolean;
  disabled?: boolean;
  idleLabel?: string;
  recordingLabel?: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  onHoldCancel: () => void;
  onSlideCancelChange?: (armed: boolean) => void;
};

export function PttButton({
  recording,
  disabled,
  idleLabel = 'Segure para gravar áudio',
  recordingLabel = 'Solte para enviar o áudio',
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
  onSlideCancelChange,
}: PttButtonProps) {
  const originY = useRef(0);
  const holding = useRef(false);
  const slidingRef = useRef(false);
  const [slidingCancel, setSlidingCancel] = useState(false);

  const syncSliding = (next: boolean) => {
    if (slidingRef.current === next) {
      return;
    }
    slidingRef.current = next;
    setSlidingCancel(next);
    onSlideCancelChange?.(next);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    originY.current = event.clientY;
    holding.current = true;
    syncSliding(false);
    onHoldStart();
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!holding.current || disabled) {
      return;
    }
    syncSliding(pttHoldShouldCancel(originY.current, event.clientY));
  };

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    holding.current = false;
    const cancel = slidingRef.current;
    syncSliding(false);
    if (cancel) {
      onHoldCancel();
      return;
    }
    onHoldEnd();
  };

  const onPointerCancel = () => {
    holding.current = false;
    syncSliding(false);
    onHoldCancel();
  };

  const label = slidingCancel ? 'Solte para cancelar' : recording ? recordingLabel : idleLabel;
  const tone = slidingCancel
    ? 'bg-muted text-muted-foreground'
    : recording
      ? 'bg-destructive text-destructive-foreground'
      : 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <button
      type="button"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ${tone} disabled:opacity-40`}
      aria-label={label}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
