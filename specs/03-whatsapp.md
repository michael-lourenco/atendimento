# 03 — WhatsApp e provedores

## Porta

`core/services/IWhatsAppService`:

- `sendMessage(params)` → envelope estilo Meta (`contacts`, `messages[].id`). `params.media` opcional. `params.instanceName` opcional (Evolution: qual instância; senão `EVOLUTION_INSTANCE_NAME`). `params.quoted` opcional: `{ messageId, fromMe, preview?, remoteJid? }` — Evolution manda `quoted.key` no `sendText`/`sendMedia`; Meta manda `context.message_id`. Twilio ignora.
- `sendReaction?(params)` opcional: `to`, `messageId`, `emoji` (vazio = remover), `fromMe`, `instanceName?`. Evolution (`/message/sendReaction/{instância}`) e Meta (Cloud API `type: reaction`). Twilio **não** implementa nesta versão.
- `sendPresence?(params)` opcional: `to`, `presence` (`composing` \| `recording` \| `paused`), `delayMs?`, `instanceName?`. Evolution `POST /chat/sendPresence/{instância}`. Meta/Twilio **não** nesta versão. PTT no compositor usa `recording` enquanto o operador segura o microfone.
- `markMessagesRead?(params)` opcional: `to`, `messageIds` (incoming da thread), `instanceName?`. Evolution `POST /chat/markMessageAsRead/{instância}` (`readMessages[]` com `remoteJid`, `fromMe: false`, `id`). Meta: `status: "read"` + `message_id` (um POST por id). Twilio **não** nesta versão. Sem o método, o use case só no-op no provedor.
- `downloadMedia?(params)` opcional: bytes + MIME a partir do id da mensagem (Evolution `getBase64FromMediaMessage`). Meta/Twilio **não** nesta versão. A rota `GET /api/messages/{id}/media` usa o método da porta, sem `instanceof`.
- `fetchProfilePicture(phone, instanceName?)` → bytes + MIME da foto de perfil, ou `null` (Meta/Twilio nesta versão; Evolution: `fetchProfilePictureUrl` + download). Falha **não** impede persistir a mensagem.
- `verifyWebhook(mode, token, challenge)` → string do challenge ou `null`
- `processWebhook(entry)` → `Message[]`

Toda implementação concreta vive em `infra/whatsapp/` e é registrada em `ServiceLocator.createWhatsAppService()`.

## Seleção

`WHATSAPP_PROVIDER` (default `meta`):

| Valor | Classe | Quando usar |
|-------|--------|-------------|
| `meta` | `WhatsAppService` | Cloud API oficial |
| `twilio` | `TwilioWhatsAppService` | Intermediário Twilio |
| `evolution` | `EvolutionWhatsAppService` | Evolution API (self-hosted comum no BR) |
| (BFF) | `ChatWhatsAppService` | QR/status/mensagens do backend `chat-whatsapp` na AWS — **não** entra no switch de `IWhatsAppService` hoje |

Novo provedor: implementar a porta, um `case` no locator, env vars nesta spec, webhook se o payload for diferente.

## Webhooks

| Rota | Provedor |
|------|----------|
| `GET/POST /api/webhook/whatsapp` | Meta (GET = verify); Twilio pode reutilizar se o payload for adaptado |
| `POST /api/webhook/evolution` | Evolution (`event` + `data?`; se não houver `data` mas houver `key`, o body inteiro vale como `data`) |
| `POST /api/webhook/chat-whatsapp` | Backend chat-whatsapp |

Após persistir incoming: `HandleIncomingWhatsAppMessageUseCase` (Meta) e o webhook Evolution (`executeMessages`) disparam `ProcessIncomingFlowUseCase` para texto. O upsert da conversa é **por thread** (contato + linha da instância/`to`/`from` — `02-domain.md`); a sessão do fluxo usa o mesmo `Conversation.id`. Sempre ACK HTTP 200 quando o provedor exigir retry-on-fail (Meta e Evolution após body válido). ACK **sem** `message` de stack no JSON (`05-api.md`). Body inválido (Zod) → 400. BFF chat-whatsapp **não** dispara o motor até unificar na porta.

Incoming Evolution: `instance` no body escolhe a linha. Só contato direto (`@s.whatsapp.net`, `@c.us`, `@lid` ou número sem sufixo). **Ignora grupos** (`@g.us`), listas de transmissão (`@broadcast`) e canais (`@newsletter`). Evento `messages.upsert` **ou** `MESSAGES_UPSERT`. Mensagem `fromMe` (enviada no próprio WhatsApp, fora do painel) é persistida como **outgoing** (`to` = contato) e **não** dispara o motor de fluxo. `pushName` só vale para incoming. Citação em `extendedTextMessage.contextInfo` (ou no `contextInfo` da mídia): grava `quotedMessageId` / `quotedContent` / `quotedFrom` e **não** muda o fluxo. Evento `messages.update` / `MESSAGES_UPDATE` (ack: PENDING=relógio, SERVER_ACK=um tique, DELIVERY_ACK=dois cinza, READ/PLAYED=dois azuis) chama `UpdateMessageStatusUseCase` e **não** dispara o fluxo. **Reação** (`reactionMessage` no upsert/update, ou evento `messages.reaction`): aplica no `id` alvo (`ApplyMessageReactionUseCase`), **não** vira bolha nem dispara o fluxo. Se a mensagem alvo ainda não existir, ignora. Evento `presence.update` / `PRESENCE_UPDATE`: `ApplyContactTypingUseCase` (composing/recording vs paused); ACK 200; **não** dispara o fluxo. Qualquer outro evento (`CONNECTION_UPDATE`, chats…) recebe ACK 200 **sem** processar.

Incoming Meta: `type === "reaction"` aplica no `reaction.message_id` e **não** entra em `processWebhook` como `Message`. `context.id` vira citação.

Mídia (imagem, áudio, vídeo, documento): o webhook baixa o arquivo (`POST /chat/getBase64FromMediaMessage/{instância}`, objeto completo da mensagem) e grava no bucket `media` em `messages/{id}`. Vídeo pede `convertToMp4: true`. Falha no download **não** impede persistir a mensagem (o painel tenta de novo no GET). Sem logar base64, payload completo nem QR. Foto de perfil: na primeira incoming sem `Contact.avatarUrl`, `POST /chat/fetchProfilePictureUrl/{instância}` + download; grava em `contacts/{id}`. Falha **não** impede o restante do turno.

## Envio

`POST /api/messages/send` → `SendWhatsAppMessageUseCase`. JSON: `to`, `message`, opcional `conversationId`, `quotedMessageId`, `type` (`text` \| `template`), `templateName`, `templateParams`. Multipart: `to`, `message` (legenda opcional), `file` (imagem/áudio/vídeo/documento, máx. 16 MB), opcional `conversationId`, `quotedMessageId`. PTT do painel é o mesmo multipart com `file` de áudio (ogg/webm). `conversationId` escolhe a **linha** da thread (instância Evolution da conversa). Sem `conversationId`, resolve pela conversa do telefone (`to`) — a mais recente se houver várias. Evolution envia via `sendMedia` / `sendWhatsAppAudio` e o arquivo vai ao bucket `media` em `messages/{id}`. Meta/Twilio recusam mídia nesta versão. Após sucesso, pausa o fluxo **dessa thread**.

Passo `message` do motor: o mesmo `SendWhatsAppMessageUseCase` com `media` em bytes. Sem rota de send nova. `loadFlowStepMedia` resolve URL `http(s)` pública **ou** objeto no Storage (`flows/{flowId}/{stepId}`) antes de chamar o send (`02-domain.md`).

`POST /api/messages/read` → `MarkWhatsAppMessagesReadUseCase`. JSON: `{ conversationId }`. Incoming da linha ainda não `read` vão ao provedor e, se o envio ok, o status local vira `read`. Falha do provedor: 200 e **não** marca local (retry). Conversa inexistente: 404.

`GET`/`POST /api/schedules/dispatch` → `DispatchDueScheduledMessagesUseCase` reutiliza o mesmo `SendWhatsAppMessageUseCase` (texto, `to` = telefone do agendamento) e pausa a sessão da conversa resolvida pelo telefone (a mais recente se houver várias). Cron HTTP (Vercel ou crontab) usa esta rota com `Authorization: Bearer CRON_SECRET`.

## BFF QR / status (`/api/chat-whatsapp/*`)

Usado pela página `/dashboard/whatsapp` (QR + status por **linha**; mensagens ficam em Conversas). Shape `{ qr, available, connected }` e `{ connected, qrAvailable, info, instances? }`. Na UI do painel o rótulo visível é o **nome da linha** (ex. Comercial), não o jargão do provedor.

Query `?instance=` escolhe **uma** linha. Sem query no status: `connected` se **qualquer** linha estiver aberta; `instances[]` lista cada uma (`name`, `connected`, `info`). O selo do header usa esse agregado + o catálogo (N conectadas de M cadastradas) — **sem rota nova**. `POST /api/chat-whatsapp/instance` `{ instanceName }` cria a instância e aponta o webhook para `NEXT_PUBLIC_APP_URL/api/webhook/evolution` (só admin).

| `WHATSAPP_PROVIDER` | Destino de `/qr` e `/status` |
|---------------------|------------------------------|
| `evolution` | Evolution (`EVOLUTION_API_URL` + instância da linha ou `EVOLUTION_INSTANCE_NAME`) |
| outro | backend `chat-whatsapp` (`CHAT_WHATSAPP_API_URL`) |

Rotas proxy: `/api/chat-whatsapp/qr`, `/status`, `/messages`, `/messages/[userId]`. Com Evolution, `/messages` lê `IMessageRepository` (o mesmo histórico de Relatórios / Mensagens).

## Variáveis de ambiente (nunca commitar)

**Comuns:** `WHATSAPP_PROVIDER`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (Bearer do cron HTTP; não usar no cliente)

**Meta:** `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_API_VERSION`, `WHATSAPP_VERIFY_TOKEN`

**Twilio:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `TWILIO_VERIFY_TOKEN`

**Evolution:** `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`, `EVOLUTION_VERIFY_TOKEN`

**chat-whatsapp:** `CHAT_WHATSAPP_API_URL`

## Evolution local (Docker)

Sidecar em `infra/evolution/docker-compose.yml` (incluso pelo `docker-compose.yml` da raiz). **Não** é o Postgres do produto (Supabase). Postgres/Redis deste compose servem só a Evolution.

Na raiz do repo:

```bash
docker compose up -d
```

- Manager/API: `http://localhost:8080`
- `EVOLUTION_API_KEY` no `.env` vira `AUTHENTICATION_API_KEY` do container (default `local-evolution-key` se a env estiver vazia)
- `EVOLUTION_INSTANCE_NAME` você cria no manager (ex.: `default`) e cola no `.env`
- Webhook local: o container chama `http://host.docker.internal:3000/api/webhook/evolution` (Next.js no host)

Não sobrescrever `.env` / `.env.local` sem confirmação do usuário.
