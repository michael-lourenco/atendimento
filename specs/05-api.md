# 05 — Contrato HTTP (App Router)

Route Handlers em `app/api/**/route.ts`. Sem inventar rotas que não estejam aqui; ao criar, atualizar esta spec no mesmo PR/tarefa.

## Mensagens

`POST /api/messages/send`

- Body JSON: `{ to: string, message: string, type?: "text"|"template", templateName?: string, templateParams?: string[] }`
- 400 se faltar `to`/`message`; 400 se `type=template` sem `templateName`
- 200: entidade `Message` persistida
- 401: sem sessão de operador quando o Supabase está configurado
- 500: falha no provedor

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
| GET | `/api/chat-whatsapp/status` | idem |
| GET | `/api/chat-whatsapp/messages` | Evolution: histórico em `IMessageRepository`; senão AWS chat-whatsapp |
| GET | `/api/chat-whatsapp/messages/[userId]` | por contato (mesmo critério) |

Erros de rede: 500 com `message` (sem vazar secrets). Com Evolution, hint aponta `EVOLUTION_API_URL` / instância.

## Auth

`POST /api/auth/login` — `{ email, password }` → 200 usuário (sem token) + cookies; 401 inválido; 503 sem Supabase.

`POST /api/auth/logout` — encerra sessão.

`GET /api/auth/me` — 200 `User` ou 401.

Sessão em cookie httpOnly. `POST /api/messages/send` → 401 sem sessão se o Supabase estiver configurado. Webhooks **não** usam sessão de operador. `service_role` só no servidor (`serverLocator`).
