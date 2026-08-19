import type { ComponentType } from 'react';
import {
  MessageSquare,
  Users,
  BarChart3,
  UserCog,
  Workflow,
  Phone,
  Tag,
  Calendar,
  Building2,
  Smartphone,
} from 'lucide-react';

export interface SidebarItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export interface SidebarGroup {
  id: 'atendimento' | 'configuracao';
  label: string;
  items: SidebarItem[];
}

export const sidebarGroups: SidebarGroup[] = [
  {
    id: 'atendimento',
    label: 'Atendimento',
    items: [
      { title: 'Conversas', href: '/dashboard/conversations', icon: MessageSquare },
      { title: 'WhatsApp', href: '/dashboard/whatsapp', icon: Smartphone },
      { title: 'Contatos', href: '/dashboard/contacts', icon: Users },
      { title: 'Relatórios', href: '/dashboard/reports', icon: BarChart3 },
    ],
  },
  {
    id: 'configuracao',
    label: 'Configuração',
    items: [
      { title: 'Fluxos', href: '/dashboard/flows', icon: Workflow },
      { title: 'Agentes', href: '/dashboard/agents', icon: UserCog },
      { title: 'Setores', href: '/dashboard/departments', icon: Building2 },
      { title: 'Números', href: '/dashboard/numbers', icon: Phone },
      { title: 'Etiquetas', href: '/dashboard/tags', icon: Tag },
      { title: 'Agendamentos', href: '/dashboard/schedules', icon: Calendar },
    ],
  },
];

const extraTitles: { href: string; title: string }[] = [
  { href: '/dashboard/messages', title: 'Mensagens' },
  { href: '/dashboard/chatbots', title: 'Chatbots' },
];

export function isSidebarItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const SIDEBAR_EXPANDED_STORAGE_KEY = 'chatbot-atimo-sidebar-expanded';

export function pageTitleFromPath(pathname: string): string {
  const items: { href: string; title: string }[] = [
    ...sidebarGroups.flatMap((group) => group.items),
    ...extraTitles,
  ];
  const match = items
    .filter((item) => isSidebarItemActive(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.title ?? 'Painel';
}
