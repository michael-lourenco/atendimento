'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { cn } from '@/ui/lib/utils';

type ActionMenuProps = {
  label: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
};

export function ActionMenu({ label, ariaLabel, disabled, children }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocument = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocument);
    return () => document.removeEventListener('mousedown', onDocument);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
      </Button>
      {open ? (
        <div className="absolute left-0 z-50 mt-1 max-h-56 min-w-[200px] overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

type ActionMenuItemProps = {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
};

export function ActionMenuItem({ children, active, onClick }: ActionMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted',
        active ? 'bg-muted font-medium' : ''
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
