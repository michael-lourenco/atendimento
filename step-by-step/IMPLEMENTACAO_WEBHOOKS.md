# 🔔 Implementação de Webhooks - chat-whatsapp → chatbot-atimo

## 📋 Visão Geral

Implementação de sistema de webhooks para comunicação em tempo real entre `chat-whatsapp` (backend AWS) e `chatbot-atimo` (frontend Next.js). Em vez de fazer polling (consultas periódicas), o servidor envia notificações quando há mudanças.

## 🏗️ Arquitetura

```
┌─────────────────────┐                    ┌──────────────────────┐
│  chat-whatsapp      │                    │   chatbot-atimo      │
│  (Backend AWS)      │─── Webhook POST ───►│   (Frontend/API)     │
│                     │                    │                      │
│  - Eventos:         │                    │  - Recebe eventos    │
│    • ready          │                    │  - Atualiza UI       │
│    • disconnected   │                    │  - Processa dados    │
│    • qr             │                    │                      │
│    • message        │                    │                      │
└─────────────────────┘                    └──────────────────────┘
```

## 📁 Arquivos Criados/Modificados

### Backend (chat-whatsapp)

#### `server.js` (modificado)

**Adicionado:**
1. **Import do axios** (linha 7):
   ```javascript
   import axios from 'axios';
   ```

2. **Função `sendWebhook()`** (após linha 43):
   ```javascript
   const WEBHOOK_URL = process.env.WEBHOOK_URL || null;
   
   async function sendWebhook(event, data) {
     if (!WEBHOOK_URL) return;
     // Envia POST para o webhook
   }
   ```

3. **Webhooks nos eventos:**
   - `client.on('ready')` → webhook `status` com `connected: true`
   - `client.on('authenticated')` → webhook `status` com `authenticated: true`
   - `client.on('auth_failure')` → webhook `status` com erro
   - `client.on('disconnected')` → webhook `status` com `connected: false`
   - `client.on('qr')` → webhook `qr` com QR Code
   - Mensagens recebidas/enviadas → webhook `message`

### Frontend (chatbot-atimo)

#### `app/api/webhook/chat-whatsapp/route.ts` (novo)

**Endpoint:** `POST /api/webhook/chat-whatsapp`

**Tipos de eventos:**
- `status`: Mudança de status (connected/disconnected/authenticated)
- `qr`: QR Code gerado
- `message`: Nova mensagem recebida/enviada

**Estrutura do payload:**
```json
{
  "event": "status|qr|message",
  "data": {
    // Dados específicos do evento
  },
  "timestamp": "2025-12-21T18:22:44.850Z"
}
```

## 🔧 Configuração

### 1. Instalar dependência no chat-whatsapp

```bash
cd /home/michael/devTestes/chat-whatsapp
npm install axios
```

### 2. Configurar variável de ambiente

No servidor `chat-whatsapp` (AWS), adicionar no `.env`:

```env
# URL do webhook do chatbot-atimo na Vercel
WEBHOOK_URL=https://atendimento-pink.vercel.app/api/webhook/chat-whatsapp
```

**Para desenvolvimento local:**
```env
WEBHOOK_URL=http://localhost:3001/api/webhook/chat-whatsapp
```

### 3. Deploy

1. Fazer deploy do `chat-whatsapp` atualizado
2. Configurar `WEBHOOK_URL` no ambiente AWS
3. Reiniciar o servidor

## 📊 Eventos Enviados

### Evento: `status`

**Quando:** Mudança de status da conexão

**Payload:**
```json
{
  "event": "status",
  "data": {
    "connected": true,
    "clientInfo": {
      "wid": "5515998970105",
      "pushname": "Nome",
      "platform": "android"
    },
    "qrAvailable": false
  }
}
```

### Evento: `qr`

**Quando:** QR Code é gerado

**Payload:**
```json
{
  "event": "qr",
  "data": {
    "qr": "data:image/png;base64,...",
    "available": true
  }
}
```

### Evento: `message`

**Quando:** Mensagem recebida ou enviada

**Payload:**
```json
{
  "event": "message",
  "data": {
    "message": {
      "id": "...",
      "from": "5515998970105@c.us",
      "to": "bot",
      "content": "Oi",
      "type": "text",
      "direction": "incoming|outgoing",
      "timestamp": "2025-12-21T18:02:52.836Z",
      "status": "received|sent"
    }
  }
}
```

## ✅ Vantagens

1. **Tempo Real**: Notificações instantâneas, sem delay
2. **Eficiente**: Não precisa fazer polling constante
3. **Confiável**: Recebe notificações diretas do servidor
4. **Escalável**: Funciona bem com múltiplos clientes
5. **Preciso**: Status sempre atualizado, sem inferências

## 🚀 Próximos Passos

1. ✅ Endpoint de webhook criado
2. ✅ Função `sendWebhook()` implementada
3. ✅ Webhooks nos eventos principais
4. ⏳ Atualizar frontend para usar webhooks (WebSocket/SSE ou polling inteligente)
5. ⏳ Testar integração completa

## 📝 Notas

- Webhooks são enviados de forma assíncrona (não bloqueiam o servidor)
- Erros de webhook não quebram o servidor (apenas logam)
- Se `WEBHOOK_URL` não estiver configurado, webhooks são ignorados silenciosamente
- Timeout de 5 segundos para evitar travamentos

---

**Data**: 2025-12-21
**Status**: ✅ Implementado (aguardando deploy e configuração)

