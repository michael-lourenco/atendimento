'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import { ChevronsLeft, ChevronsRight, Loader2, X } from 'lucide-react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import {
  isSidebarItemActive,
  isSidebarItemPending,
  sidebarGroupsForRole,
  type SidebarItem,
} from '../lib/sidebar-nav';

interface SidebarProps {
  className?: string;
  expanded: boolean;
  onToggle: () => void;
  role: 'admin' | 'user';
  pendingHref?: string | null;
  onNavigate?: (href: string) => void;
}

function NavLink({
  item,
  pathname,
  expanded,
  pendingHref,
  onNavigate,
}: {
  item: SidebarItem;
  pathname: string;
  expanded: boolean;
  pendingHref?: string | null;
  onNavigate?: (href: string) => void;
}) {
  const Icon = item.icon;
  const isActive = isSidebarItemActive(pathname, item.href);
  const isPending = isSidebarItemPending(pendingHref ?? null, item.href, pathname);
  const link = (
    <Link
      href={item.href}
      onClick={() => onNavigate?.(item.href)}
      aria-busy={isPending}
      className={cn(
        'flex items-center rounded-lg p-3 text-sm font-medium transition-colors',
        expanded ? 'gap-3 px-3' : 'w-full justify-center',
        isActive
          ? 'bg-primary text-primary-foreground'
          : isPending
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {isPending ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
      ) : (
        <Icon className="h-5 w-5 shrink-0" />
      )}
      {expanded ? <span className="truncate">{item.title}</span> : <span className="sr-only">{item.title}</span>}
    </Link>
  );

  if (expanded) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        <p>{item.title}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  expanded,
  onToggle,
  role,
  pendingHref,
  onNavigate,
}) => {
  const pathname = usePathname();
  const groups = sidebarGroupsForRole(role);

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-[width]',
          expanded ? 'w-56' : 'w-16',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b border-border px-3">
            {expanded ? (
              <p className="truncate text-sm font-semibold text-foreground">Menu</p>
            ) : null}
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {groups.map((group, index) => (
              <div key={group.id} className="space-y-1">
                {expanded ? (
                  <p className="flex items-center gap-2 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        group.id === 'atendimento' ? 'bg-primary' : 'bg-muted-foreground/60'
                      )}
                    />
                    {group.label}
                  </p>
                ) : index > 0 ? (
                  <div
                    className="mx-1 my-2 border-t border-border"
                    role="separator"
                    aria-label={group.label}
                  />
                ) : null}
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    expanded={expanded}
                    pendingHref={pendingHref}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ))}
          </nav>
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size={expanded ? 'sm' : 'icon'}
              className={expanded ? 'w-full justify-start' : 'w-full'}
              onClick={onToggle}
              aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
            >
              {expanded ? (
                <>
                  <ChevronsLeft className="mr-2 h-4 w-4" />
                  Recolher
                </>
              ) : (
                <ChevronsRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'user';
  pendingHref?: string | null;
  onNavigate?: (href: string) => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  role,
  pendingHref,
  onNavigate,
}) => {
  const pathname = usePathname();
  const groups = sidebarGroupsForRole(role);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card transition-transform',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <h2 className="text-lg font-semibold text-foreground">Menu</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {groups.map((group) => (
              <div key={group.id} className="mb-4">
                <p className="flex items-center gap-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      group.id === 'atendimento' ? 'bg-primary' : 'bg-muted-foreground/60'
                    )}
                  />
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = isSidebarItemActive(pathname, item.href);
                    const isPending = isSidebarItemPending(pendingHref ?? null, item.href, pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => {
                          onNavigate?.(item.href);
                          onClose();
                        }}
                        aria-busy={isPending}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : isPending
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        {isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
