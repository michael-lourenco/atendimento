'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/ui/components/button';

type ConfirmState = {
  message: string;
  resolve: (ok: boolean) => void;
};

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, resolve });
    });
  }, []);

  const close = (ok: boolean) => {
    state?.resolve(ok);
    setState(null);
  };

  const dialog = state ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg"
      >
        <p className="text-sm text-foreground">{state.message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => close(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => close(true)}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
