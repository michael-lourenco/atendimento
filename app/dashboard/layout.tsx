'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { LogoutUseCase } from '@/core/usecases/LogoutUseCase';
import { Button } from '@/ui/components/button';
import { ThemeToggle } from '@/ui/components/theme-toggle';
import { Sidebar, MobileSidebar } from '@/ui/components/sidebar';
import { WhatsAppStatusChip } from '@/ui/components/whatsapp-status';
import { Menu } from 'lucide-react';
import { User } from '@/core/entities/User';
import { pageTitleFromPath, SIDEBAR_EXPANDED_STORAGE_KEY } from '@/ui/lib/sidebar-nav';
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
    const checkAuth = async () => {
      const getCurrentUserUseCase = new GetCurrentUserUseCase();
      const currentUser = await getCurrentUserUseCase.execute();
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar className="hidden lg:block" expanded={sidebarExpanded} onToggle={toggleSidebar} />
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

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
  );
}
