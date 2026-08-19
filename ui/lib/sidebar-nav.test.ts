import { isAdminPath, sidebarGroupsForRole } from './sidebar-nav';

describe('sidebarGroupsForRole', () => {
  it('atendente vê Conversas, Contatos e Respostas rápidas', () => {
    const hrefs = sidebarGroupsForRole('user').flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toEqual([
      '/dashboard/conversations',
      '/dashboard/contacts',
      '/dashboard/quick-replies',
    ]);
  });

  it('admin vê configuração', () => {
    const hrefs = sidebarGroupsForRole('admin').flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs).toContain('/dashboard/agents');
    expect(hrefs).toContain('/dashboard/whatsapp');
  });

  it('URLs de configuração são admin', () => {
    expect(isAdminPath('/dashboard/agents')).toBe(true);
    expect(isAdminPath('/dashboard/whatsapp')).toBe(true);
    expect(isAdminPath('/dashboard/conversations')).toBe(false);
    expect(isAdminPath('/dashboard/quick-replies')).toBe(false);
  });
});
