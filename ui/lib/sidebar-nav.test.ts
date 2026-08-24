import {
  isAdminPath,
  isSidebarItemPending,
  pendingSidebarHref,
  sidebarGroupsForRole,
} from './sidebar-nav';

describe('sidebarGroupsForRole', () => {
  it('atendente vê Conversas, Contatos, Respostas rápidas e Agendamentos', () => {
    const hrefs = sidebarGroupsForRole('user').flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toEqual([
      '/dashboard/conversations',
      '/dashboard/contacts',
      '/dashboard/quick-replies',
      '/dashboard/schedules',
    ]);
  });

  it('admin vê configuração', () => {
    const items = sidebarGroupsForRole('admin').flatMap((group) => group.items);
    const hrefs = items.map((item) => item.href);
    expect(hrefs).toContain('/dashboard/agents');
    expect(hrefs).toContain('/dashboard/whatsapp');
    expect(hrefs).toContain('/dashboard/messages');
    expect(items.find((item) => item.href === '/dashboard/messages')?.title).toBe('Histórico');
    expect(hrefs).toContain('/dashboard/chatbots');
    expect(items.find((item) => item.href === '/dashboard/chatbots')?.title).toBe('Chatbot');
  });

  it('URLs de configuração são admin', () => {
    expect(isAdminPath('/dashboard/agents')).toBe(true);
    expect(isAdminPath('/dashboard/whatsapp')).toBe(true);
    expect(isAdminPath('/dashboard/conversations')).toBe(false);
    expect(isAdminPath('/dashboard/quick-replies')).toBe(false);
    expect(isAdminPath('/dashboard/schedules')).toBe(false);
    expect(isAdminPath('/dashboard/flows/inicio')).toBe(true);
    expect(isAdminPath('/dashboard/flows/new')).toBe(true);
    expect(isAdminPath('/dashboard/chatbots')).toBe(true);
  });

  it('clique em outra tela marca loading; a tela atual não', () => {
    expect(pendingSidebarHref('/dashboard/conversations', '/dashboard/contacts')).toBe(
      '/dashboard/contacts'
    );
    expect(pendingSidebarHref('/dashboard/conversations', '/dashboard/conversations')).toBeNull();
    expect(pendingSidebarHref('/dashboard/flows/inicio', '/dashboard/flows')).toBeNull();
    expect(
      isSidebarItemPending('/dashboard/contacts', '/dashboard/contacts', '/dashboard/conversations')
    ).toBe(true);
    expect(
      isSidebarItemPending('/dashboard/contacts', '/dashboard/contacts', '/dashboard/contacts')
    ).toBe(false);
  });
});
