# 03 — WhatsApp e provedores

## Porta

`core/services/IWhatsAppService`:

- `sendMessage(params)` → envelope estilo Meta (`contacts`, `messages[].id`)
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
| `POST /api/webhook/evolution` | Evolution (`event` + `data`) |
| `POST /api/webhook/chat-whatsapp` | Backend chat-whatsapp |

Após persistir incoming: `HandleIncomingWhatsAppMessageUseCase` (Meta) e o webhook Evolution (`executeMessages`) disparam `ProcessIncomingFlowUseCase` para texto. Sempre ACK HTTP 200 quando o provedor exigir retry-on-fail (Meta). BFF chat-whatsapp **não** dispara o motor até unificar na porta.

Incoming Evolution: só contato direto (`@s.whatsapp.net`, `@c.us`, `@lid` ou número sem sufixo). **Ignora grupos** (`@g.us`), listas de transmissão (`@broadcast`) e canais (`@newsletter`). Evento `messages.upsert` **ou** `MESSAGES_UPSERT`. Mensagem `fromMe` (enviada no próprio WhatsApp, fora do painel) é persistida como **outgoing** (`to` = contato) e **não** dispara o motor de fluxo. `pushName` só vale para incoming.

Mídia (imagem, áudio, vídeo, documento): o webhook baixa o arquivo (`POST /chat/getBase64FromMediaMessage/{instância}`, objeto completo da mensagem) e grava no bucket `media` em `messages/{id}`. Vídeo pede `convertToMp4: true`. Falha no download **não** impede persistir a mensagem (o painel tenta de novo no GET). Sem logar base64.

## Envio

`POST /api/messages/send` → `SendWhatsAppMessageUseCase`. Body: `to`, `message`, opcional `type` (`text` \| `template`), `templateName`, `templateParams`.

## BFF QR / status (`/api/chat-whatsapp/*`)

Usado pela página `/dashboard/whatsapp`. O shape JSON da tela permanece `{ qr, available, connected }` e `{ connected, qrAvailable, info }`.

| `WHATSAPP_PROVIDER` | Destino de `/qr` e `/status` |
|---------------------|------------------------------|
| `evolution` | Evolution (`EVOLUTION_API_URL` + instância `EVOLUTION_INSTANCE_NAME`) |
| outro | backend `chat-whatsapp` (`CHAT_WHATSAPP_API_URL`) |

Rotas proxy: `/api/chat-whatsapp/qr`, `/status`, `/messages`, `/messages/[userId]`. Com Evolution, `/messages` lê `IMessageRepository` (o mesmo histórico de Relatórios / Mensagens).

## Variáveis de ambiente (nunca commitar)

**Comuns:** `WHATSAPP_PROVIDER`, `NEXT_PUBLIC_APP_URL`

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
