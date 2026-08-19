# 08 — Persistência e Auth (Supabase) — Fase 4

Decisão: **Supabase** (Postgres + Auth + Storage). **Não** usar Firestore, Firebase Auth, D1 nem Cloudflare Access como Auth do painel.

Cloudflare **R2** só entra depois, se a mídia ultrapassar o Storage do Supabase. D1 **não** é o banco deste produto.

Detalhe desta fase: `07-roadmap.md`. Implementado em `infra/supabase/` e `/api/auth/*`. Sem env Supabase, o app cai nos mocks (exceto a UI de login, que não lista usuários de teste).

## Por quê

O domínio é relacional (conversa, contato, agente, `FlowSession`, mensagens). Next.js 15 permanece; só as implementações em `infra/` mudam. Auth de operadores vem pronto (GoTrue), sem JWT caseiro.

## Clientes

| Client | Onde | Chave |
|--------|------|--------|
| Browser / SSR do painel | `@supabase/ssr` (cookies httpOnly) | `anon` |
| Route Handlers do painel | sessão do cookie | `anon` + RLS |
| Webhooks WhatsApp e motor de fluxo | só servidor | `service_role` |

`service_role` **nunca** no cliente, nunca em `NEXT_PUBLIC_*`. Não logar JWTs nem a service role.

## Auth (operadores)

- `IAuthRepository` → `SupabaseAuthRepository`: `signInWithPassword`, `signOut`, sessão via cookie.
- Papel `admin` \| `user` em `public.profiles` (`id` = `auth.users.id`, `email`, `name`, `role`).
- Login mock (`admin@example.com` / qualquer senha) **acaba**. Seed de um admin só via SQL/dashboard Supabase, não hardcoded na UI.
- `LoginUseCase` / `GetCurrentUserUseCase` / `LogoutUseCase` permanecem; a página `/login` some a dica de usuários de teste.
- `POST /api/messages/send` e demais rotas de operador exigem sessão válida (401 sem cookie).
- `GET`/`POST /api/schedules/dispatch`: sessão de operador **ou** Bearer `CRON_SECRET` (cron HTTP; o job in-process não passa por HTTP).
- Webhooks (`/api/webhook/*`) **não** usam sessão de operador; continuam verify token do provedor + client `service_role`.

## RLS (mínimo)

- `authenticated`: CRUD do painel conforme política (início: qualquer autenticado lê/escreve o tenant único; refinar por setor na Fase 5 se necessário).
- `service_role`: webhooks e motor (bypass RLS).
- Tabela `profiles`: o próprio usuário lê a si; só `admin` altera `role`.

## Postgres (tabelas ↔ entidades)

Uma tabela por agregado da spec `02`. IDs `uuid` (default `gen_random_uuid()`), timestamps `timestamptz`.

`profiles`, `flows` (+ `flow_steps` JSONB ou tabela filha), `flow_sessions` (PK `contact_id`), `messages`, `conversations`, `departments`, `internal_messages`, `chatbots`, `agents`, `contacts`, `whatsapp_numbers`, `tags`, `scheduled_messages`, `reports`.

FKs onde o domínio já relaciona (`conversation.contact_id`, `chatbot.flow_id`, `agent.department_id`). `Flow.steps` pode ser JSONB na v1 para não explodir o schema.

Migrations em `infra/supabase/migrations/` (SQL versionado). Sem editar schema só no dashboard. `002_flow_session_paused.sql` adiciona `flow_sessions.paused`.

## Storage

Bucket privado `media` para anexos WhatsApp na v1. Objetos em `messages/{id}`. O painel não usa URL pública: `GET /api/messages/{id}/media` lê o Storage (service_role) ou baixa na Evolution e faz cache. Sem AWS S3 nesta fase.

## Composição

- Implementações em `infra/supabase/` (`SupabaseFlowRepository`, etc.) cumprindo as portas de `core/repositories`.
- Composition root na borda (`app/` + `ServiceLocator`): **prod/dev com env Supabase** usa repos reais; **test** continua fake/mock.
- Use cases deixam de depender do locator no construtor quando possível (injeção na borda).
- `core` não importa `@supabase/supabase-js`.

## Env (não commitar secrets)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

## Fora desta fase

- Multi-tenant (várias empresas)
- Auth mágica só por WhatsApp
- Troca do host Next.js para Cloudflare Workers
- Firestore / D1 como fonte da verdade
