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

## Fase atual: 5

## Fase 5 — Produção

- Validação Zod nas APIs
- Sem logs de token / service role
- Observabilidade mínima (request id, erros)
- RLS por setor (opcional, se o produto exigir)
- R2 só se o Storage do Supabase não bastar para mídia

## Não fazer

- Criar `step-by-step/` como documentação de avanço
- Trocar de stack (Nest, Firebase, D1 como banco, outro CSS) sem atualizar `01-architecture.md` e `08-supabase.md`
- Rodar a suíte de testes no lugar do usuário
