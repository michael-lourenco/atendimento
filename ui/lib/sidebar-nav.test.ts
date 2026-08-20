import { isAdminPath, sidebarGroupsForRole } from './sidebar-nav';

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
    const hrefs = sidebarGroupsForRole('admin').flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain('/dashboard/agents');
    expect(hrefs).toContain('/dashboard/whatsapp');
    expect(hrefs).toContain('/dashboard/chatbots');
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
});
