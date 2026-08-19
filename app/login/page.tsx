'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LOGIN_DENIED_OFFLINE, LOGIN_DENIED_QUERY, LoginDeniedError } from '@/core/entities/loginDenied';
import { LoginUseCase } from '@/core/usecases/LoginUseCase';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { ThemeToggle } from '@/ui/components/theme-toggle';
import { createBrowserSupabase } from '@/infra/supabase/browserClient';
import { isPublicSupabaseConfigured } from '@/infra/supabase/env';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const denied = new URLSearchParams(window.location.search).get(LOGIN_DENIED_QUERY);
    if (denied === LOGIN_DENIED_OFFLINE) {
      setError('Este atendente está desativado');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const loginUseCase = new LoginUseCase();
      const user = await loginUseCase.execute(email, password);

      if (user) {
        router.push('/dashboard/conversations');
      } else {
        setError('Email ou senha inválidos');
      }
    } catch (err) {
      setError(
        err instanceof LoginDeniedError ? err.message : 'Erro ao fazer login. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Informe o e-mail para redefinir a senha.');
      return;
    }
    try {
      const supabase = createBrowserSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) {
        setError('Não foi possível enviar o e-mail. Tente novamente.');
        return;
      }
      setInfo('Se o e-mail existir, você receberá o link de redefinição.');
    } catch {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Chatbot Atendimento</CardTitle>
          <CardDescription>Entre para atender as conversas do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            {info ? (
              <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border border-border">
                {info}
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            {isPublicSupabaseConfigured() ? (
              <button
                type="button"
                className="w-full text-sm text-muted-foreground underline"
                onClick={() => void handleForgotPassword()}
              >
                Esqueci a senha
              </button>
            ) : null}
          </form>
          {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
            <p className="mt-4 text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
              Configure <code>NEXT_PUBLIC_SUPABASE_URL</code> e{' '}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no .env.local e rode as migrations em{' '}
              <code>infra/supabase/migrations/</code>.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
