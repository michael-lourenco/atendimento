# 05 — Contrato HTTP (App Router)

Route Handlers em `app/api/**/route.ts`. Sem inventar rotas que não estejam aqui; ao criar, atualizar esta spec no mesmo PR/tarefa.

Helpers da borda em `infra/http` (`01-architecture.md`). Sem porta nova em `core`.

## Observabilidade (Fase 5)

Todo response de `/api/**` inclui o header `x-request-id`:

- Se o cliente mandar `x-request-id` com comprimento `<= 128` chars, ecoar esse valor
- Senão, gerar um UUID

Erros de servidor logam `[requestId] mensagem: detalhe`. **Não** logar: token, apikey, `service_role`, JWT, `Authorization`, body de mídia/base64, `error.response.data` completo. Webhooks **não** logam payload completo nem QR. Não vazar stack no JSON de resposta.

## Validação Zod (POST/PATCH com JSON)

Bodies JSON das rotas abaixo passam por schema Zod na borda. Inválido → `400 { error: string }` (sem stack). GET e DELETE sem body **não** precisam de Zod. Multipart de `POST /api/messages/send` continua no parser existente; o ramo JSON passa a usar Zod.

| Rota | Schema (campos) |
|------|-----------------|
| `POST /api/auth/login` | `{ email, password }` |
| `POST /api/operators` | `{ email, password, name, role?, departmentId? }` |
| `PATCH /api/operators/{id}` | `{ role?, password? }` (pelo menos um) |
| `POST /api/messages/send` (JSON) | `{ to, message, conversationId?, type?, templateName?, templateParams? }` (Zod no JSON; hoje `parseSendRequest`) |
| `POST /api/messages/react` | `{ messageId, emoji }` (`emoji` vazio ou o mesmo da linha remove) |
| `POST /api/webhook/evolution` | `{ event, data?, instance? }` — compat: se não houver `data` mas houver `key`, o **body inteiro** vale como `data` |
| `POST /api/webhook/chat-whatsapp` | `{ event, data }` |
| `POST /api/webhook/whatsapp` | body Meta com `object` + `entry` (schema frouxo / passthrough) |

## Mensagens

`POST /api/messages/send`

- JSON: `{ to: string, message: string, conversationId?: string, type?: "text"|"template", templateName?: string, templateParams?: string[] }`
- Multipart: `to`, `message` (legenda, opcional se houver arquivo), `file`, `conversationId` (opcional)
- `conversationId` escolhe a thread/linha; sem ele, resolve pela conversa do `to` (a mais recente se houver várias)
- 400 se faltar `to`; 400 se não houver `message` nem arquivo; 400 se `type=template` sem `templateName`; 400 se arquivo > 16 MB
- 200: entidade `Message` persistida (`type` image/audio/video/document quando houver arquivo)
- Após envio bem-sucedido, pausa o fluxo **dessa thread** (`PauseContactFlowUseCase` com o id da conversa) e, se houver mídia, grava no Storage
- 401: sem sessão de operador quando o Supabase está configurado
- 500: falha no provedor
- Emoji Unicode no `message`, **resposta rápida** (o `body` já está no compositor) e **Reenviar** de outgoing `failed` usam este mesmo POST (mesmo `to` + texto + `conversationId` da thread). Sem rota extra. Sem `/api/quick-replies`: o catálogo no painel usa `QuickReplyCatalogUseCase` no client

`POST /api/messages/react`

- JSON: `{ messageId: string, emoji: string }` (máx. 16 chars; vazio remove a reação da linha)
- 400 se faltar `messageId`
- 401: sem sessão de operador quando o Supabase está configurado
- 404: mensagem inexistente
- 200: `Message` com `reactions` atualizado
- 500: falha no provedor (Twilio não envia reação nesta versão)
- Não pausa o fluxo. Não incrementa não lidas

`GET` / `POST /api/schedules/dispatch`

- Sem body
- Envia os `ScheduledMessage` `pending` cuja `scheduledDate` já passou (`DispatchDueScheduledMessagesUseCase`). Se o item tem `conversationId`, o send/pause usam essa thread; senão, o telefone (conversa mais recente)
- 200: `{ sent: string[], failed: string[] }` (ids)
- Auth: sessão de operador **ou** `Authorization: Bearer CRON_SECRET` (secret não vazio)
- 401: Supabase configurado e nenhum dos dois
- 500: falha ao ler/gravar agendamentos
- Lock `inFlight` no processo: chamadas simultâneas no mesmo Node compartilham a execução
- Cron Vercel: `vercel.json` chama `GET` a cada minuto (`CRON_SECRET` no host). `next dev` / `next start` (não Vercel) disparam no processo a cada 60s, sem HTTP

`GET /api/messages/{id}/media`

- Stream do arquivo (áudio/imagem/vídeo/documento) para o painel
- 401: sem sessão de operador quando o Supabase está configurado
- 404: mensagem inexistente, tipo texto, ou mídia indisponível na Evolution/Storage
- 200: bytes + `Content-Type`; cache no bucket `media` (`messages/{id}`) na primeira leitura

`GET /api/contacts/{id}/avatar`

- Stream da foto de perfil (bucket `media` em `contacts/{id}`)
- 401: sem sessão de operador quando o Supabase está configurado
- 404: sem arquivo (contato sem foto ou download da Evolution ainda não ocorreu)
- 200: bytes + `Content-Type`; `Cache-Control: private, max-age=3600`

`POST /api/contacts/avatars/sync` — sem body. Recalcula fotos em falta (copia `Contact.avatarUrl` para a thread; senão baixa na Evolution, lote). 401 sem sessão se o Supabase estiver configurado. 200 `{ attempted, filled }`. Sem Zod (sem JSON).

## Webhooks

`GET /api/webhook/whatsapp` — query `hub.mode`, `hub.verify_token`, `hub.challenge`. 200 texto do challenge ou 403.

`POST /api/webhook/whatsapp` — body Meta (`object` + `entry[]`). Zod frouxo. Sempre 200 após tentativa de processamento (ACK). Sem `message` interno/stack no JSON.

`POST /api/webhook/evolution` — `{ event, data?, instance? }` (compat `key` → body como `data`, ver tabela Zod). 400 se o schema falhar. Processamento: ACK **200** sem `message` de stack (hoje o handler pode devolver 200 com texto de erro — em produção o ACK permanece 200, sem vazar detalhe interno).

`POST /api/webhook/chat-whatsapp` — `{ event, data }`. 400 se inválido. 200 ACK sem stack.

Webhooks não autenticam operador do painel. Não logar tokens, payload completo, QR nem corpos com mídia.

## Proxy conexão WhatsApp (QR)

| Método | Rota | Destino |
|--------|------|---------|
| GET | `/api/chat-whatsapp/qr` | `?instance=` opcional |
| GET | `/api/chat-whatsapp/status` | `?instance=` opcional: **sem** query = agregado (`connected` se qualquer linha aberta + `instances[]`); **com** query = aquela linha (`connected`/`info` dela; `instances[]` pode vir no mesmo shape) |
| POST | `/api/chat-whatsapp/instance` | `{ instanceName }` cria instância Evolution + webhook. Só admin |
| GET | `/api/chat-whatsapp/messages` | Evolution: histórico em `IMessageRepository`; senão AWS chat-whatsapp |
| GET | `/api/chat-whatsapp/messages/[userId]` | por contato (mesmo critério) |

Erros de rede: 500 com `message` genérico (sem vazar secrets nem stack). Com Evolution, hint aponta `EVOLUTION_API_URL` / instância — **não** apikey.

`GET /api/chat-whatsapp/status` (sem rota extra para o selo):

- Sem `instance`: `{ connected, qrAvailable, info, instances? }` — `connected` se **qualquer** linha estiver aberta; `instances[]` = `{ name, connected, info }[]` (uma entrada por linha conhecida). O header do painel cruza isso com o catálogo de Números: M = linhas cadastradas, N = quantas estão `connected`.
- Com `instance`: `connected` / `info` daquela linha. Sem inventar query nem endpoint novo; o cliente pode agregar catálogo + este GET.

## Auth

`POST /api/auth/login` — `{ email, password }` (Zod) → 200 usuário (sem token) + cookies; 400 body inválido; 401 inválido; 403 agente `offline`; 503 sem Supabase. A dica de env na UI de login cita só `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Não** citar `SUPABASE_SERVICE_ROLE_KEY` (só servidor). **Não** há rota de “esqueci a senha”: o reset é o e-mail do Auth no cliente (anon) — `08-supabase.md`.

`POST /api/auth/logout` — encerra sessão.

`GET /api/auth/me` — 200 `User` ou 401.

`GET /api/operators` — lista `User[]`. Só admin. 401/403.

`POST /api/operators` — `{ email, password, name, role?: "admin"|"user", departmentId? }` (Zod). Cria login (Auth) + perfil + agente. Senha mín. 6. 201 `User`. 400 body inválido. 409 e-mail duplicado (já existe em Auth, `profiles` ou `agents`, case-insensitive). Só admin.

`PATCH /api/operators/{id}` — `{ role?: "admin"|"user", password?: string }` (Zod; pelo menos um). Papel: 400 se for o último admin. Senha: mín. 6; `service_role` + `auth.admin.updateUserById`. 404 se o id não existir. Só admin.

`DELETE /api/operators/{id}` — apaga Auth + perfil + agente. 400 se for o último admin. 404 se o id não existir. Só admin. `service_role` só no servidor para `auth.admin.deleteUser`.

Sessão em cookie httpOnly. `POST /api/messages/send` → 401 sem sessão se o Supabase estiver configurado. `GET`/`POST /api/schedules/dispatch` aceita sessão **ou** Bearer `CRON_SECRET`. Webhooks **não** usam sessão de operador. `service_role` só no servidor (`serverLocator`). `POST /api/operators` usa `service_role` só para `auth.admin.createUser`. `PATCH /api/operators/{id}` com `password` usa `service_role` para `auth.admin.updateUserById`. `DELETE /api/operators/{id}` usa `service_role` só para `auth.admin.deleteUser` e para apagar o agente.
