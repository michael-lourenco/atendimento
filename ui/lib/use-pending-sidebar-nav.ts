'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { pendingSidebarHref } from './sidebar-nav';

export function usePendingSidebarNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function onSidebarNavigate(href: string) {
    setPendingHref(pendingSidebarHref(pathname, href));
  }

  return { pendingHref, onSidebarNavigate };
}
