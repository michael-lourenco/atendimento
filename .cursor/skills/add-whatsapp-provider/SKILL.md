---
name: add-whatsapp-provider
description: Adds or changes a WhatsApp provider implementing IWhatsAppService and ServiceLocator switch. Use when working with Meta, Twilio, Evolution, chat-whatsapp, WHATSAPP_PROVIDER, or webhooks.
---

# Novo provedor WhatsApp

Leia `specs/03-whatsapp.md` e `specs/05-api.md`. Atualize-as com env vars e rota de webhook.

## Checklist

1. Classe em `infra/whatsapp/` implementando `IWhatsAppService`.
2. `sendMessage` retorna `{ messaging_product, contacts, messages: [{ id }] }`.
3. `processWebhook` devolve `Message[]` do domínio (não o JSON cru).
4. `case` em `ServiceLocator.createWhatsAppService()` com valor de `WHATSAPP_PROVIDER`.
5. Webhook dedicado se o payload não for Meta (`app/api/webhook/<nome>/route.ts`).
6. Não commitar secrets. Não sobrescrever `.env.local`.

## Fora deste fluxo

`ChatWhatsAppService` (QR/status) não implementa a porta hoje. Não forçar no switch sem mudar a spec `03`.

## Incoming

Depois de salvar mensagens, **não** disparar fluxo automático até `connect-flow-engine` / spec `02` autorizarem.
