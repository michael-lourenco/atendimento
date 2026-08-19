'use client';

import { useEffect, useRef, useState } from 'react';
import { CATALOG_SAVED_NOTICE_MS } from '@/ui/lib/catalog-saved';

export function useCatalogSavedFlash(ttlMs = CATALOG_SAVED_NOTICE_MS) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const markSaved = () => {
    setShow(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setShow(false), ttlMs);
  };

  return { show, markSaved };
}
