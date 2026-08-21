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

- Chatbot, agentes, contatos, números, tags, schedules, relatórios, setores, chat interno e conversas via use cases
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
- Logs sanitizados: `[requestId] mensagem: detalhe` sem secrets, JWT, Authorization, senha, cookie, mídia/base64, payload completo de webhook, QR; painel sem `console.*` de erro
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
- Ícone de microfone no picker para respostas de áudio
- Busca no picker de respostas rápidas; Enviando…/erro ao baixar áudio
- Deslizar para cima cancela o PTT
- Atalho `/` e `Ctrl`/`⌘`+`/` no compositor para respostas rápidas
- Respostas rápidas opcionais por setor
- Rascunho de texto por conversa (`localStorage`)
- Finalizar abre a próxima da Entrada (setor/minhas/linha)
- Clique na imagem da bolha amplia (overlay)
- Comportamento do bot: delay/digitando; conhecido = thread desta linha + contato já no catálogo; idle só na pergunta; reabertura → menu conhecido
- Fluxo de entrada no chatbot ativo (`Chatbot.flowId`); overlay por linha (`WhatsAppNumber.flowId`); fallback `inicio`
- Expediente por linha (`WhatsAppNumber.businessHours`)
- Mídia anexada (imagem/áudio) no bloco Mensagem do editor de fluxos (bucket `media`, path `flows/{flowId}/{stepId}`, rotas `PUT`/`GET`/`DELETE /api/flows/{flowId}/steps/{stepId}/media`)
- Avisos de roteiro clicáveis no editor (`flowHealthIssues` → seleciona bloco, abre inspetor, foca o nó)
- Anexar mídia no bloco Mensagem grava o fluxo (se já tiver nome; mesmo save do `Ctrl`/`⌘`+S) e em seguida faz o PUT; sem nome, “Dê um nome ao fluxo” e não anexa
- Pausa do bloco Mensagem na tela em segundos (0–8); grava `delayMs` (0–8000) com `msToSeconds` / `secondsToMs`
- Chatbot: atalho **Editar este fluxo** no `EntryFlowSelect` (empresa e linha) → `/dashboard/flows/{flowId}`; sem fluxo escolhido, **Abrir Fluxos** na lista
- Menu e header: rótulo **Chatbot** (singular); URL permanece `/dashboard/chatbots`
- Simulador do fluxo: bolhas com mídia (`image`/`audio`) e seletor **Novo** / **Conhecido**; após `handoff` o bot não responde
- Chatbot: confirmar antes de trocar **Vale para** com rascunho; expediente e ritmo nascem recolhidos
- Palavras-chave do fluxo no editor em chips (Enter/vírgula/colar; X tira)
- Simulador: depois de `goToFlow` o turno seguinte fica no destino; o quadro acompanha o fluxo da sessão e destaca o passo atual
- Presence do compositor: não dispara `paused` ao abrir/sair com campo vazio; `POST /api/messages/presence` devolve 204 se a Evolution falhar
- Logs: só `logApiError` na borda HTTP; sem `console` no painel nem status/QR/mídia nos provedores
- UX: aviso Salvo/erro nos catálogos; Assumir visível; idade da fila; checklist de setup; Histórico no menu; rascunho em `localStorage`; simulador com Reabertura; desfazer 10 no quadro

## Não fazer

- Criar `step-by-step/` como documentação de avanço
- Trocar de stack (Nest, Firebase, D1 como banco, outro CSS) sem atualizar `01-architecture.md` e `08-supabase.md`
- Rodar a suíte de testes no lugar do usuário
