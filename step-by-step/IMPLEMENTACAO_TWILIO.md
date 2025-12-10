# 📱 Implementação com Twilio - Guia Passo a Passo

## 📋 Visão Geral

Este documento detalha como configurar e usar o Twilio como serviço intermediário para WhatsApp, ao invés de se conectar diretamente à API da Meta.

## 🎯 Por que Twilio?

- ✅ Setup mais simples (sem aprovação da Meta)
- ✅ API REST direta e bem documentada
- ✅ Suporte profissional
- ✅ Trial gratuito para testes
- ✅ Escalável e confiável

## 📦 Passo 1: Instalar Dependências

```bash
npm install twilio
```

## 🔑 Passo 2: Criar Conta no Twilio

1. Acesse: https://www.twilio.com/
2. Crie uma conta gratuita (trial)
3. Verifique seu número de telefone
4. Acesse o Console: https://console.twilio.com/

## 📞 Passo 3: Obter Número WhatsApp Business

1. No Console do Twilio, vá em **Messaging** > **Try it out** > **Send a WhatsApp message**
2. Siga o wizard para obter um número WhatsApp Business de teste
3. **Número de teste**: `whatsapp:+14155238886` (número do Twilio para testes)
4. Para produção, você precisará solicitar um número verificado

## 🔐 Passo 4: Obter Credenciais

No Console do Twilio, você encontrará:

1. **Account SID**: Começa com `AC...`
2. **Auth Token**: Token secreto (mostrado apenas uma vez)
3. **WhatsApp Number**: O número que você obteve (ex: `+14155238886`)

## ⚙️ Passo 5: Configurar Variáveis de Ambiente

Atualize seu arquivo `.env.local`:

```env
# Escolher Twilio como provedor
WHATSAPP_PROVIDER=twilio

# Credenciais Twilio
TWILIO_ACCOUNT_SID=seu_account_sid_aqui
TWILIO_AUTH_TOKEN=seu_auth_token_aqui
TWILIO_WHATSAPP_NUMBER=+14155238886

# Token para verificação do webhook (você escolhe)
TWILIO_VERIFY_TOKEN=seu_token_aleatorio_seguro_aqui

# URL base do seu servidor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante**: 
- Nunca commite o `TWILIO_AUTH_TOKEN` no Git
- Use variáveis de ambiente seguras em produção

## 🔗 Passo 6: Configurar Webhook no Twilio

1. No Console do Twilio, vá em **Messaging** > **Settings** > **WhatsApp Sandbox Settings**
2. Configure o webhook para receber mensagens:
   - **When a message comes in**: `https://seu-dominio.com/api/webhook/whatsapp`
   - **Status callback URL**: `https://seu-dominio.com/api/webhook/whatsapp` (opcional)

**Para desenvolvimento local:**
- Use ngrok: `ngrok http 3000`
- Configure o webhook com a URL do ngrok: `https://xxxx.ngrok.io/api/webhook/whatsapp`

## 🧪 Passo 7: Testar Envio de Mensagem

### Via API REST:

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste via Twilio"
  }'
```

### Via Código:

```typescript
import { serviceLocator } from '@/infra/adapters/ServiceLocator';

const whatsAppService = serviceLocator.getWhatsAppService();

await whatsAppService.sendMessage({
  to: '5511999999999',
  message: 'Olá! Mensagem via Twilio',
});
```

## 📥 Passo 8: Receber Mensagens

O webhook já está configurado em `app/api/webhook/whatsapp/route.ts`.

**Nota**: O formato do webhook do Twilio é diferente do Meta. Você precisará adaptar o método `processWebhook()` no `TwilioWhatsAppService.ts` para processar corretamente os webhooks do Twilio.

### Formato do Webhook Twilio:

```json
{
  "MessageSid": "SM...",
  "AccountSid": "AC...",
  "From": "whatsapp:+5511999999999",
  "To": "whatsapp:+14155238886",
  "Body": "Mensagem recebida",
  "NumMedia": "0"
}
```

## 🔄 Passo 9: Alternar entre Provedores

Para voltar a usar a API da Meta:

```env
WHATSAPP_PROVIDER=meta
```

Para usar Twilio:

```env
WHATSAPP_PROVIDER=twilio
```

O `ServiceLocator` automaticamente carrega o serviço correto baseado nessa variável.

## ⚠️ Diferenças entre Meta e Twilio

| Recurso | Meta Cloud API | Twilio |
|---------|----------------|--------|
| Templates | Suportado | Via Twilio Studio |
| Mídia | Suportado | Suportado |
| Webhooks | Formato específico | Formato diferente |
| Setup | Requer aprovação | Mais simples |
| Custo | Variável | ~$0.005/mensagem |

## 🐛 Troubleshooting

### Erro: "Twilio SDK não instalado"
```bash
npm install twilio
```

### Erro: "Credenciais Twilio não configuradas"
Verifique se todas as variáveis de ambiente estão configuradas no `.env.local`.

### Mensagens não chegam
1. Verifique se o webhook está configurado corretamente no Twilio Console
2. Verifique se a URL do webhook está acessível (use ngrok para desenvolvimento)
3. Verifique os logs do servidor para erros

### Número não funciona
- Números de teste do Twilio só funcionam com números verificados
- Para produção, solicite um número WhatsApp Business verificado

## 📚 Recursos Adicionais

- **Documentação Twilio WhatsApp**: https://www.twilio.com/docs/whatsapp
- **Twilio Console**: https://console.twilio.com/
- **Twilio Node.js SDK**: https://www.twilio.com/docs/libraries/node

## 🎯 Próximos Passos

1. ✅ Instalar dependências
2. ✅ Configurar credenciais
3. ✅ Testar envio de mensagens
4. ⏳ Adaptar processamento de webhooks (formato Twilio)
5. ⏳ Implementar suporte a mídia
6. ⏳ Configurar para produção

---

**Arquivo criado em**: `infra/whatsapp/TwilioWhatsAppService.ts`
**ServiceLocator atualizado**: `infra/adapters/ServiceLocator.ts`

