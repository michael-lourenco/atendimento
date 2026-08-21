import { DepartmentFilter } from '@/core/entities/conversationDepartment';
import { LineFilter } from '@/core/entities/inboxFilterHint';

export const INBOX_FILTERS_KEY_PREFIX = 'inbox-filters:';

export type InboxFilterPrefs = {
  mineOnly: boolean;
  departmentFilter: DepartmentFilter;
  lineFilter: LineFilter;
};

export function inboxFiltersKey(operatorId: string): string {
  return `${INBOX_FILTERS_KEY_PREFIX}${operatorId.trim()}`;
}

export function parseInboxFilterPrefs(raw: string | null): InboxFilterPrefs | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as Partial<InboxFilterPrefs>;
    if (typeof value.mineOnly !== 'boolean') {
      return null;
    }
    if (typeof value.departmentFilter !== 'string' || !value.departmentFilter.trim()) {
      return null;
    }
    if (typeof value.lineFilter !== 'string' || !value.lineFilter.trim()) {
      return null;
    }
    return {
      mineOnly: value.mineOnly,
      departmentFilter: value.departmentFilter,
      lineFilter: value.lineFilter,
    };
  } catch {
    return null;
  }
}

export function serializeInboxFilterPrefs(prefs: InboxFilterPrefs): string {
  return JSON.stringify(prefs);
}

type PrefsStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function readInboxFilterPrefs(
  operatorId: string,
  store: PrefsStore | null = browserPrefsStore()
): InboxFilterPrefs | null {
  const id = operatorId.trim();
  if (!id || !store) {
    return null;
  }
  return parseInboxFilterPrefs(store.getItem(inboxFiltersKey(id)));
}

export function writeInboxFilterPrefs(
  operatorId: string,
  prefs: InboxFilterPrefs,
  store: PrefsStore | null = browserPrefsStore()
): void {
  const id = operatorId.trim();
  if (!id || !store) {
    return;
  }
  store.setItem(inboxFiltersKey(id), serializeInboxFilterPrefs(prefs));
}

export function browserPrefsStore(): PrefsStore | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    return localStorage;
  } catch {
    return null;
  }
}
