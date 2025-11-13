'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const getCurrentUserUseCase = new GetCurrentUserUseCase();
      const user = await getCurrentUserUseCase.execute();
      if (user) {
        router.push('/dashboard/flows');
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Carregando...</h1>
      </div>
    </div>
  );
}

