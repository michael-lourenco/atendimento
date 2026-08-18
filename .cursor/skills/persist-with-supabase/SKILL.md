---
name: persist-with-supabase
description: Replaces chatbot-atimo mocks with Supabase Postgres and Auth per spec 08. Use when implementing Fase 4, IAuthRepository, RLS, service_role webhooks, or swapping Firestore/D1.
---

# Persistência Supabase (Fase 4)

Leia `specs/08-supabase.md`, `specs/01-architecture.md` e `specs/07-roadmap.md`. Só implemente se o usuário pediu executar a Fase 4.

## Regras

1. Portas em `core/` inalteradas. Classes novas só em `infra/supabase/`.
2. Auth: `@supabase/ssr`, cookie httpOnly, `IAuthRepository`. Papel em `profiles`. Remover login “qualquer senha” e o texto de usuários de teste.
3. Painel: chave `anon` + RLS. Webhooks/motor: `service_role` só no servidor.
4. `core` não importa `@supabase/supabase-js`.
5. Migrations SQL em `infra/supabase/migrations/`.
6. Testes unitários com fakes — **sem** bater no projeto Supabase.
7. Não commitar `SUPABASE_SERVICE_ROLE_KEY`. `.env.local` só com confirmação do usuário.
8. Não usar Firestore, D1 nem Firebase Auth.

## Ordem sugerida

1. Clients (browser cookie vs server service role)
2. `profiles` + `SupabaseAuthRepository` + proteger `/api/messages/send`
3. Uma porta (ex.: flows) ponta a ponta
4. Demais repositórios no `ServiceLocator`
5. Storage `media` quando houver anexo

Não rode `npm test`. Liste os comandos ao usuário.
