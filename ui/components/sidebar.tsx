'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/utils';
import {
  MessageSquare,
  Users,
  Bot,
  BarChart3,
  UserCog,
  Workflow,
  Phone,
  Tag,
  Calendar,
  Menu,
  X,
  Building2,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Conversas',
    href: '/dashboard/conversations',
    icon: MessageSquare,
  },
  {
    title: 'Chat Interno',
    href: '/dashboard/internal-chat',
    icon: MessageCircle,
  },
  {
    title: 'Setores',
    href: '/dashboard/departments',
    icon: Building2,
  },
  {
    title: 'Contatos',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    title: 'Chatbots',
    href: '/dashboard/chatbots',
    icon: Bot,
  },
  {
    title: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Multi Atendentes',
    href: '/dashboard/agents',
    icon: UserCog,
  },
  {
    title: 'Fluxos de Atendimento',
    href: '/dashboard/flows',
    icon: Workflow,
  },
  {
    title: 'Diversos Números',
    href: '/dashboard/numbers',
    icon: Phone,
  },
  {
    title: 'Etiquetas',
    href: '/dashboard/tags',
    icon: Tag,
  },
  {
    title: 'Agendamento',
    href: '/dashboard/schedules',
    icon: Calendar,
  },
  {
    title: 'WhatsApp',
    href: '/dashboard/whatsapp',
    icon: Smartphone,
  },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-16 border-r border-border bg-card',
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b border-border">
            <h2 className="text-lg font-semibold text-foreground opacity-0 w-0">
              Menu
            </h2>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-center rounded-lg p-3 text-sm font-medium transition-colors w-full',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={5}>
                    <p>{item.title}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
};

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

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
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

