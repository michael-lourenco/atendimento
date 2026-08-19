# 05 — Contrato HTTP (App Router)

Route Handlers em `app/api/**/route.ts`. Sem inventar rotas que não estejam aqui; ao criar, atualizar esta spec no mesmo PR/tarefa.

## Mensagens

`POST /api/messages/send`

- JSON: `{ to: string, message: string, type?: "text"|"template", templateName?: string, templateParams?: string[] }`
- Multipart: `to`, `message` (legenda, opcional se houver arquivo), `file`
- 400 se faltar `to`; 400 se não houver `message` nem arquivo; 400 se `type=template` sem `templateName`; 400 se arquivo > 16 MB
- 200: entidade `Message` persistida (`type` image/audio/video/document quando houver arquivo)
- Após envio bem-sucedido, pausa o fluxo daquele `to` (`PauseContactFlowUseCase`) e, se houver mídia, grava no Storage
- 401: sem sessão de operador quando o Supabase está configurado
- 500: falha no provedor

`GET` / `POST /api/schedules/dispatch`

- Sem body
- Envia os `ScheduledMessage` `pending` cuja `scheduledDate` já passou (`DispatchDueScheduledMessagesUseCase`)
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

## Webhooks

`GET /api/webhook/whatsapp` — query `hub.mode`, `hub.verify_token`, `hub.challenge`. 200 texto do challenge ou 403.

`POST /api/webhook/whatsapp` — body Meta (`object: whatsapp_business_account`, `entry[]`). Sempre 200 após tentativa de processamento.

`POST /api/webhook/evolution` — `{ event, data, instance? }`. 400 se formato inválido.

`POST /api/webhook/chat-whatsapp` — payload do backend AWS. 200 ACK.

Webhooks não autenticam operador do painel. Não logar tokens nem corpos completos com mídia em produção.

## Proxy conexão WhatsApp (QR)

| Método | Rota | Destino |
|--------|------|---------|
| GET | `/api/chat-whatsapp/qr` | Evolution se `WHATSAPP_PROVIDER=evolution`; senão `CHAT_WHATSAPP_API_URL` |
| GET | `/api/chat-whatsapp/status` | idem; se `connected` + `wid`, upsert no catálogo (`SyncLiveWhatsAppNumberUseCase`); falha no upsert não muda o JSON de status |
| GET | `/api/chat-whatsapp/messages` | Evolution: histórico em `IMessageRepository`; senão AWS chat-whatsapp |
| GET | `/api/chat-whatsapp/messages/[userId]` | por contato (mesmo critério) |

Erros de rede: 500 com `message` (sem vazar secrets). Com Evolution, hint aponta `EVOLUTION_API_URL` / instância.

## Auth

`POST /api/auth/login` — `{ email, password }` → 200 usuário (sem token) + cookies; 401 inválido; 503 sem Supabase.

`POST /api/auth/logout` — encerra sessão.

`GET /api/auth/me` — 200 `User` ou 401.

Sessão em cookie httpOnly. `POST /api/messages/send` → 401 sem sessão se o Supabase estiver configurado. `GET`/`POST /api/schedules/dispatch` aceita sessão **ou** Bearer `CRON_SECRET`. Webhooks **não** usam sessão de operador. `service_role` só no servidor (`serverLocator`).
