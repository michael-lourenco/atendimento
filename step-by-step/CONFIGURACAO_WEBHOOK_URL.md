# 🔧 Configuração do WEBHOOK_URL

## 📍 Onde Configurar

O `WEBHOOK_URL` deve estar configurado no **projeto `chat-whatsapp`** (backend na AWS).

## 🔗 URL do chatbot-atimo

**Produção (Vercel):**
```
https://atendimento-pink.vercel.app
```

**Endpoint de Webhook:**
```
https://atendimento-pink.vercel.app/api/webhook/chat-whatsapp
```

## ⚙️ Configuração

### No servidor `chat-whatsapp` (AWS)

Adicionar no arquivo `.env`:

```env
# URL do webhook do chatbot-atimo na Vercel
WEBHOOK_URL=https://atendimento-pink.vercel.app/api/webhook/chat-whatsapp
```

### Para desenvolvimento local

Se estiver testando localmente, use:

```env
# URL do webhook do chatbot-atimo local
WEBHOOK_URL=http://localhost:3001/api/webhook/chat-whatsapp
```

## 📊 Fluxo

```
chat-whatsapp (AWS)                    chatbot-atimo (Vercel)
     │                                        │
     │  POST /api/webhook/chat-whatsapp      │
     │───────────────────────────────────────►│
     │  { event: 'status', data: {...} }     │
     │                                        │
```

## ✅ Verificação

Após configurar o `WEBHOOK_URL` e reiniciar o servidor `chat-whatsapp`, você verá nos logs:

```
📤 Webhook enviado: status
📤 Webhook enviado: qr
📤 Webhook enviado: message
```

E no console do `chatbot-atimo` (Vercel):

```
[Webhook chat-whatsapp] Evento recebido: status
[Webhook chat-whatsapp] Status atualizado: connected=true
```

## 🔍 Troubleshooting

Se os webhooks não estiverem chegando:

1. **Verificar se a URL está correta:**
   ```bash
   curl https://atendimento-pink.vercel.app/api/webhook/chat-whatsapp
   ```
   Deve retornar erro 405 (Method Not Allowed) ou similar, mas não 404.

2. **Verificar logs do chat-whatsapp:**
   - Se aparecer `❌ Erro ao enviar webhook`, verificar conectividade
   - Se não aparecer nada, verificar se `WEBHOOK_URL` está configurado

3. **Verificar logs do chatbot-atimo (Vercel):**
   - Acessar logs da Vercel
   - Verificar se há erros ao processar webhooks

---

**Data**: 2025-12-21
**URL Produção**: https://atendimento-pink.vercel.app
**Endpoint Webhook**: https://atendimento-pink.vercel.app/api/webhook/chat-whatsapp


