type PickerKeyEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
};

export function isQuickReplyPickerOpenKey(event: PickerKeyEvent, draft: string): boolean {
  if (event.altKey) {
    return false;
  }
  if ((event.ctrlKey || event.metaKey) && event.key === '/') {
    return true;
  }
  if (event.ctrlKey || event.metaKey) {
    return false;
  }
  return event.key === '/' && draft.length === 0;
}
