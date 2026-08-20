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
  Reply,
  Bot,
} from 'lucide-react';

export interface SidebarItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

export interface SidebarGroup {
  id: 'atendimento' | 'configuracao';
  label: string;
  items: SidebarItem[];
  adminOnly?: boolean;
}

export const sidebarGroups: SidebarGroup[] = [
  {
    id: 'atendimento',
    label: 'Atendimento',
    items: [
      { title: 'Conversas', href: '/dashboard/conversations', icon: MessageSquare },
      { title: 'WhatsApp', href: '/dashboard/whatsapp', icon: Smartphone, adminOnly: true },
      { title: 'Contatos', href: '/dashboard/contacts', icon: Users },
      { title: 'Respostas rápidas', href: '/dashboard/quick-replies', icon: Reply },
      { title: 'Agendamentos', href: '/dashboard/schedules', icon: Calendar },
      { title: 'Relatórios', href: '/dashboard/reports', icon: BarChart3, adminOnly: true },
    ],
  },
  {
    id: 'configuracao',
    label: 'Configuração',
    adminOnly: true,
    items: [
      { title: 'Fluxos', href: '/dashboard/flows', icon: Workflow },
      { title: 'Chatbot', href: '/dashboard/chatbots', icon: Bot },
      { title: 'Agentes', href: '/dashboard/agents', icon: UserCog },
      { title: 'Setores', href: '/dashboard/departments', icon: Building2 },
      { title: 'Números', href: '/dashboard/numbers', icon: Phone },
      { title: 'Etiquetas', href: '/dashboard/tags', icon: Tag },
    ],
  },
];

export function sidebarGroupsForRole(role: 'admin' | 'user'): SidebarGroup[] {
  return sidebarGroups
    .filter((group) => role === 'admin' || !group.adminOnly)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => role === 'admin' || !item.adminOnly),
    }))
    .filter((group) => group.items.length > 0);
}

const extraTitles: { href: string; title: string }[] = [
  { href: '/dashboard/messages', title: 'Mensagens' },
  { href: '/dashboard/flows/new', title: 'Novo fluxo' },
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

export function isAdminPath(pathname: string): boolean {
  const hrefs = sidebarGroups.flatMap((group) =>
    group.adminOnly ? group.items.map((item) => item.href) : group.items.filter((item) => item.adminOnly).map((item) => item.href)
  );
  hrefs.push('/dashboard/messages');
  return hrefs.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}
