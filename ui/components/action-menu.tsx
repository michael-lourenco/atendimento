'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/ui/components/button';
import { cn } from '@/ui/lib/utils';

type ActionMenuProps = {
  label: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  align?: 'start' | 'end';
  variant?: 'default' | 'icon';
  onOpenChange?: (open: boolean) => void;
  children: (close: () => void) => ReactNode;
};

export function ActionMenu({
  label,
  ariaLabel,
  disabled,
  align = 'start',
  variant = 'default',
  onOpenChange,
  children,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocument = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', onDocument);
    return () => document.removeEventListener('mousedown', onDocument);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant={variant === 'icon' ? 'ghost' : 'outline'}
        size={variant === 'icon' ? 'icon' : 'sm'}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            onOpenChange?.(next);
            return next;
          });
        }}
      >
        {label}
        {variant === 'default' ? <ChevronDown className="ml-1 h-3 w-3 opacity-70" /> : null}
      </Button>
      {open ? (
        <div
          className={cn(
            'absolute z-50 mt-1 max-h-56 min-w-[200px] overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {children(() => {
            setOpen(false);
            onOpenChange?.(false);
          })}
        </div>
      ) : null}
    </div>
  );
}

type ActionMenuItemProps = {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
};

export function ActionMenuItem({
  children,
  active,
  disabled,
  destructive,
  onClick,
}: ActionMenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50',
        active ? 'bg-muted font-medium' : '',
        destructive ? 'text-destructive hover:text-destructive' : ''
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ActionMenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}
