'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { LogoutUseCase } from '@/core/usecases/LogoutUseCase';
import { LoginDeniedError, loginDeniedHref } from '@/core/entities/loginDenied';
import { Button } from '@/ui/components/button';
import { ThemeToggle } from '@/ui/components/theme-toggle';
import { Sidebar, MobileSidebar } from '@/ui/components/sidebar';
import { WhatsAppStatusChip } from '@/ui/components/whatsapp-status';
import { WhatsAppStatusProvider } from '@/ui/lib/use-whatsapp-status';
import { Menu } from 'lucide-react';
import { User } from '@/core/entities/User';
import { isAdmin } from '@/core/entities/operatorRole';
import { Badge } from '@/ui/components/badge';
import { isAdminPath, pageTitleFromPath, SIDEBAR_EXPANDED_STORAGE_KEY } from '@/ui/lib/sidebar-nav';
import { DASHBOARD_POLL_MS } from '@/ui/lib/dashboard-poll';
import { cn } from '@/ui/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
    if (stored === '0') {
      setSidebarExpanded(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async (first: boolean) => {
      try {
        const currentUser = await new GetCurrentUserUseCase().execute();
        if (!currentUser) {
          setUser(null);
          router.push('/login');
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        setUser(null);
        router.push(error instanceof LoginDeniedError ? loginDeniedHref() : '/login');
      } finally {
        if (first) {
          setLoading(false);
        }
      }
    };
    void checkAuth(true);
    const timer = setInterval(() => void checkAuth(false), DASHBOARD_POLL_MS);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => {
    if (!user || isAdmin(user) || !isAdminPath(pathname)) {
      return;
    }
    router.replace('/dashboard/conversations');
  }, [user, pathname, router]);

  const toggleSidebar = () => {
    setSidebarExpanded((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  const handleLogout = async () => {
    const logoutUseCase = new LogoutUseCase();
    await logoutUseCase.execute();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin(user) && isAdminPath(pathname)) {
    return null;
  }

  return (
    <WhatsAppStatusProvider>
      <div className="min-h-screen bg-background">
      <Sidebar
        className="hidden lg:block"
        expanded={sidebarExpanded}
        onToggle={toggleSidebar}
        role={user.role}
      />
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        role={user.role}
      />

      <div className={cn(sidebarExpanded ? 'lg:pl-56' : 'lg:pl-16')}>
        <nav className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="ml-2 lg:ml-0">
                  <p className="text-xs text-muted-foreground leading-none">
                    Chatbot Atendimento
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">
                    {pageTitleFromPath(pathname)}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <WhatsAppStatusChip />
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {user.name} ({user.email})
                </span>
                {isAdmin(user) ? <Badge variant="info">Admin</Badge> : null}
                <ThemeToggle />
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      </div>
    </WhatsAppStatusProvider>
  );
}
