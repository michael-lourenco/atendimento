'use client';

import { useEffect, useRef, useState } from 'react';
import { DepartmentFilter } from '@/core/entities/conversationDepartment';
import { LineFilter } from '@/core/entities/inboxFilterHint';
import { readInboxFilterPrefs, writeInboxFilterPrefs } from '@/ui/lib/inbox-filter-prefs';

export function useInboxFilterPrefs(operatorId: string | undefined, defaultDepartmentId?: string) {
  const [mineOnly, setMineOnly] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('all');
  const [lineFilter, setLineFilter] = useState<LineFilter>('all');
  const hydrated = useRef(false);
  const skipWrite = useRef(true);

  useEffect(() => {
    if (!operatorId || hydrated.current) {
      return;
    }
    hydrated.current = true;
    skipWrite.current = true;
    const stored = readInboxFilterPrefs(operatorId);
    if (stored) {
      setMineOnly(stored.mineOnly);
      setDepartmentFilter(stored.departmentFilter);
      setLineFilter(stored.lineFilter);
      return;
    }
    if (defaultDepartmentId) {
      setDepartmentFilter(defaultDepartmentId);
    }
  }, [operatorId, defaultDepartmentId]);

  useEffect(() => {
    if (!operatorId || !hydrated.current) {
      return;
    }
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    writeInboxFilterPrefs(operatorId, { mineOnly, departmentFilter, lineFilter });
  }, [operatorId, mineOnly, departmentFilter, lineFilter]);

  return {
    mineOnly,
    setMineOnly,
    departmentFilter,
    setDepartmentFilter,
    lineFilter,
    setLineFilter,
  };
}
