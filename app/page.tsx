'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GetCurrentUserUseCase } from '@/core/usecases/GetCurrentUserUseCase';
import { LoginDeniedError, loginDeniedHref } from '@/core/entities/loginDenied';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await new GetCurrentUserUseCase().execute();
        if (user) {
          router.push('/dashboard/conversations');
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push(error instanceof LoginDeniedError ? loginDeniedHref() : '/login');
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

