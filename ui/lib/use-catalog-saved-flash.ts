'use client';

import { useEffect, useRef, useState } from 'react';
import { CATALOG_SAVED_NOTICE_MS } from '@/ui/lib/catalog-saved';

export function useCatalogSavedFlash(ttlMs = CATALOG_SAVED_NOTICE_MS) {
  const [show, setShow] = useState(false);
  const [kind, setKind] = useState<'success' | 'error'>('success');
  const [message, setMessage] = useState('Salvo');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const flash = (nextKind: 'success' | 'error', nextMessage: string) => {
    setKind(nextKind);
    setMessage(nextMessage);
    setShow(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setShow(false), ttlMs);
  };

  return {
    show,
    kind,
    message,
    markSaved: () => flash('success', 'Salvo'),
    flashSuccess: (text: string) => flash('success', text),
    flashError: (text: string) => flash('error', text),
  };
}
