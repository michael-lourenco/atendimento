'use client';

import { FlowStep } from '@/core/entities/Flow';
import { popCanvasHistory, pushCanvasHistory } from '@/ui/lib/flow-canvas-history';
import { isTypingTarget } from '@/ui/lib/use-catalog-search-shortcut';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useFlowCanvasUndo(steps: FlowStep[], onChange: (next: FlowStep[]) => void) {
  const historyRef = useRef<FlowStep[][]>([]);
  const [depth, setDepth] = useState(0);

  const commit = useCallback(
    (next: FlowStep[]) => {
      historyRef.current = pushCanvasHistory(historyRef.current, steps);
      setDepth(historyRef.current.length);
      onChange(next);
    },
    [onChange, steps]
  );

  const undo = useCallback(() => {
    const popped = popCanvasHistory(historyRef.current);
    historyRef.current = popped.stack;
    setDepth(popped.stack.length);
    if (popped.snapshot) {
      onChange(popped.snapshot);
    }
  }, [onChange]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z' || event.shiftKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      if (historyRef.current.length === 0) {
        return;
      }
      event.preventDefault();
      undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo]);

  return { commit, undo, canUndo: depth > 0 };
}
