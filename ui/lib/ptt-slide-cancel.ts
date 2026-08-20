export const PTT_SLIDE_CANCEL_PX = 72;

export function pttHoldShouldCancel(
  startClientY: number,
  currentClientY: number,
  thresholdPx = PTT_SLIDE_CANCEL_PX
): boolean {
  return startClientY - currentClientY >= thresholdPx;
}
