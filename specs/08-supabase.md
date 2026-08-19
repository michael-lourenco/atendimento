# 08 — Persistência e Auth (Supabase)

Decisão: **Supabase** (Postgres + Auth + Storage). **Não** usar Firestore, Firebase Auth, D1 nem Cloudflare Access como Auth do painel.

**Não** introduzir Cloudflare **R2** nem outro object storage nesta fase. D1 **não** é o banco deste produto. Storage de mídia = bucket Supabase `media`.

Detalhe da Fase 4 (implementada): `07-roadmap.md`. Código em `infra/supabase/` e `/api/auth/*`. Sem env Supabase, o app cai nos mocks (exceto a UI de login, que não lista usuários de teste).

## Implantação: uma empresa = um projeto

Não é multi-tenant. Cada empresa tem **um** projeto Supabase (Postgres + Auth + Storage) na infra dela, pareado a **um** app Next.js e **uma** instância de provedor WhatsApp.

Replicar para outra empresa:

1. Novo projeto Supabase
2. Env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` no **servidor**)
3. Rodar migrations `001`–`007` nesse projeto

Empresa XYZ não lê dados nem config da HZJ: o isolamento é a cópia da stack, não `company_id`.

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
- **Esqueci a senha** em `/login`: dispara o e-mail de redefinição do Auth (`resetPasswordForEmail` no cliente **anon**). Sem rota nova em `/api/auth`, sem `service_role`. Dica de env continua só `NEXT_PUBLIC_*`.
- Papel `admin` \| `user` em `public.profiles` (`id` = `auth.users.id`, `email`, `name`, `role`).
- O **primeiro** perfil no banco é `admin`; os seguintes nascem `user`.
- Cada perfil gera um `agents` com o **mesmo id** (trigger `handle_new_user` + backfill em `004_operator_agent.sql`). `EnsureOperatorAgentUseCase` cobre mock e perfil antigo. E-mail de agente único: índice `agents_email_lower_uidx` (`012_unique_agent_email.sql`); o trigger não insere se `lower(trim(email))` já existir.
- Login mock (`admin@example.com` / qualquer senha) **acaba**. Seed de um admin só via SQL/dashboard Supabase, não hardcoded na UI — salvo o primeiro signup, que já é admin.
- `LoginUseCase` / `GetCurrentUserUseCase` / `LogoutUseCase` permanecem; a página `/login` some a dica de usuários de teste. Agente `status: offline` não entra: `POST /api/auth/login` responde 403 e faz `signOut`; login e sessão atual (`GetCurrentUserUseCase`) recusam e encerram; o dashboard manda para `/login?denied=offline`.
- Dica de env na UI de login: só URL + anon (`NEXT_PUBLIC_*`). **Não** citar `SUPABASE_SERVICE_ROLE_KEY` — essa chave é só servidor (`serverLocator`).
- `POST /api/messages/send` e demais rotas de operador exigem sessão válida (401 sem cookie).
- `GET`/`POST /api/schedules/dispatch`: sessão de operador **ou** Bearer `CRON_SECRET` (cron HTTP; o job in-process não passa por HTTP).
- Webhooks (`/api/webhook/*`) **não** usam sessão de operador; continuam verify token do provedor + client `service_role`.
- `DELETE /api/operators/{id}` usa `service_role` para `auth.admin.deleteUser` e para apagar o agente.
- `PATCH /api/operators/{id}` com senha usa `service_role` para `auth.admin.updateUserById`.

## RLS (mínimo)

- `authenticated`: CRUD do painel conforme política — qualquer autenticado **desta stack** lê/escreve (uma empresa = este projeto). **Não** RLS por setor nesta fase.
- `service_role`: webhooks e motor (bypass RLS).
- Tabela `profiles`: o próprio usuário lê a si; só `admin` altera `role`.

## Postgres (tabelas ↔ entidades)

Uma tabela por agregado da spec `02`. IDs em geral `uuid` (default `gen_random_uuid()`), timestamps `timestamptz`. `conversations.id` e `flow_sessions.contact_id` já são **PK `text`**: servem `{digitosDoTelefone}` e `{digitos}:{lineId}` **sem coluna nova**.

`profiles`, `flows` (+ `flow_steps` JSONB ou tabela filha), `flow_sessions` (PK `contact_id` = `Conversation.id` da thread), `messages`, `conversations`, `departments`, `internal_messages`, `chatbots`, `agents`, `contacts`, `whatsapp_numbers`, `tags`, `quick_replies`, `scheduled_messages`, `reports`.

FKs onde o domínio já relaciona (`conversation.contact_id` = telefone do cadastro, `chatbot.flow_id`, `agent.department_id`). `Flow.steps` pode ser JSONB na v1 para não explodir o schema.

Migrations em `infra/supabase/migrations/` (SQL versionado). Sem editar schema só no dashboard. `002_flow_session_paused.sql` adiciona `flow_sessions.paused`. `003_sales_intake_seed.sql` grava setores Comercial/Demonstração/Cliente, agentes, etiquetas e o fluxo `inicio` de triagem. `004_operator_agent.sql` faz o perfil nascer como agente e o primeiro usuário ser admin. `005_whatsapp_lines.sql` adiciona `whatsapp_numbers.instance_name` e `conversations.whatsapp_number_id`. `006_conversation_thread.sql` garante essas colunas (`if not exists`, caso a 005 não tenha rodado) e cria índice único `(contact_phone, whatsapp_number_id)` **onde** `whatsapp_number_id` não é null — uma thread por contato+linha. `flow_sessions.contact_id` guarda o id da thread, não o telefone isolado quando a conversa é composta. `007_quick_replies.sql` cria `quick_replies` (`id` text PK, `title`, `body`, `created_at`). RLS igual às outras tabelas de catálogo (`authenticated` all: `using (true) with check (true)`). Sem `company_id`. Sem seed de frases (prod começa vazio; 2–3 exemplos só no mock de dev/test). `008_miss_returns_to_menu.sql` liga o passo `miss` do fluxo `inicio` a `menu`, para reapresentar as opções sem o “Olá”. `009_welcome_michael.sql` troca a saudação do fluxo `inicio` de Atimo para Michael. `010_schedule_conversation.sql` adiciona `scheduled_messages.conversation_id` (text, nullable) — thread da linha quando o agendamento nasce no chat. `011_conversation_last_message.sql` adiciona `conversations.last_message` (jsonb, snapshot da última mensagem para a prévia da inbox). Sem essa coluna, upsert **não** envia `last_message` (PGRST204); a inbox hidrata a prévia em memória. `012_unique_agent_email.sql` colapsa `agents` duplicados pelo mesmo e-mail (mantém a linha cujo `id` = `profiles.id`; senão a mais antiga), remapeia `conversations.assigned_agent_id`, e cria índice único em `lower(trim(email))`. O trigger `handle_new_user` deixa de inserir agente se o e-mail já existir. `013_contact_avatar.sql` adiciona `contacts.avatar_url` e `conversations.contact_avatar_url` (text, nullable). Sem essas colunas, o save **omite** os campos (PGRST204). `014_flow_option_number_hint.sql` atualiza o texto do passo `miss` do fluxo `inicio` para aceitar o **número** da opção além do texto.

## Storage

Bucket privado `media` para anexos WhatsApp na v1. Objetos em `messages/{id}` (mídia da mensagem) e `contacts/{id}` (foto de perfil). O painel não usa URL pública: `GET /api/messages/{id}/media` e `GET /api/contacts/{id}/avatar` leem o Storage (service_role). Sem AWS S3 nesta fase.

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

## Fora desta fase (e da Fase 5)

- Multi-tenant (várias empresas no mesmo projeto/app; `company_id`)
- RLS por setor / departamento (opcional futuro; isolamento entre empresas já é por infra)
- R2 / Cloudflare Storage
- Auth mágica só por WhatsApp
- Troca do host Next.js para Cloudflare Workers
- Firestore / D1 como fonte da verdade
