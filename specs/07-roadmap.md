# 07 — Roadmap

Ordem sugerida. Não executar uma fase sem o usuário pedir. Atualizar esta spec quando uma fase terminar.

## Fase 1 — Painel + mocks + WhatsApp plugável (feita)

- Login mock, fluxos CRUD, conversas mock, webhooks e envio
- Provedores Meta / Twilio / Evolution + BFF QR chat-whatsapp

## Fase 2 — Motor de fluxos (feita)

- `FlowSession` + mock `IFlowSessionRepository`
- `core/engine` + `ProcessIncomingFlowUseCase`
- Incoming texto (Meta e Evolution) → passos → `SendWhatsAppMessageUseCase`

## Fase 3 — Tirar vitrines do dashboard (feita)

- Chatbots, agentes, contatos, números, tags, schedules, relatórios, setores, chat interno e conversas via use cases
- Páginas não importam `infra/mocks`

## Fase 4 — Supabase (Postgres + Auth + Storage) (feita)

Spec: `08-supabase.md`.

- `infra/supabase/` (clients, migrations, repos)
- Auth cookie httpOnly (`/api/auth/login|logout|me`)
- Webhooks e envio usam `serverLocator` (`service_role`)
- Painel usa `anon` + RLS via browser client
- `POST /api/messages/send` exige sessão quando o Supabase está configurado
- Agendamentos: cron in-process (60s) em `next dev`/`next start`; na Vercel, `GET /api/schedules/dispatch` (`vercel.json` + `CRON_SECRET`)

## Fase atual: 5 (feita)

## Fase 5 — Produção (feita)

- Validação Zod nos POST/PATCH JSON de `app/api/**` (login, operators, send JSON, webhooks). `400 { error: string }`. GET sem Zod
- Header `x-request-id` em todo `/api/**`
- Logs sanitizados: `[requestId] mensagem: detalhe` sem secrets, JWT, Authorization, mídia/base64, payload completo de webhook, QR
- Webhooks: ACK 200 sem `message` de stack
- Dica de login na UI: só `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nunca `SUPABASE_SERVICE_ROLE_KEY`)
- Pasta `infra/http` (request id, log, schemas). Sem porta nova em `core`. Zod já no `package.json`

### Fora da Fase 5

- Multi-tenant / `company_id` / várias empresas no mesmo banco
- RLS por setor / departamento
- R2 / Cloudflare Storage
- Troca de stack (Nest, Firebase, D1 como banco)

Isolamento entre empresas = cópia da stack (`00-vision.md`, `08-supabase.md`).

## Pós-Fase 5 (esta entrega)

- Health de schema (admin)
- Citação de mensagem
- Presence / digitando (Evolution)
- SLA na inbox de relatórios (1ª resposta humana + fila sem dono)
- PTT no compositor (áudio via send existente)
- Recibo de leitura ao abrir a thread (`POST /api/messages/read`)
- Busca da inbox e do histórico pelo texto das mensagens
- Áudio pré-gravado nas respostas rápidas
- PTT no cadastro de respostas rápidas (mesmo gravador do chat)

## Não fazer

- Criar `step-by-step/` como documentação de avanço
- Trocar de stack (Nest, Firebase, D1 como banco, outro CSS) sem atualizar `01-architecture.md` e `08-supabase.md`
- Rodar a suíte de testes no lugar do usuário
