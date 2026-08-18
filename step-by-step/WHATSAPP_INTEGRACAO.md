# 📱 Integração com WhatsApp - Documentação Step-by-Step

## 📋 Visão Geral

Este documento detalha toda a implementação da integração real com WhatsApp Business API (Meta Cloud API) no sistema de chatbot.

## 🏗️ Arquitetura Implementada

### Estrutura de Arquivos Criados

```
core/
├── services/
│   └── IWhatsAppService.ts          # Interface do serviço WhatsApp
├── usecases/
│   ├── SendWhatsAppMessageUseCase.ts      # Use case para enviar mensagens
│   └── HandleIncomingWhatsAppMessageUseCase.ts  # Use case para receber mensagens

infra/
├── whatsapp/
│   └── WhatsAppService.ts           # Implementação real do serviço

app/
└── api/
    ├── webhook/
    │   └── whatsapp/
    │       └── route.ts             # Webhook para receber mensagens
    └── messages/
        └── send/
            └── route.ts             # API para enviar mensagens
```

---

## 📝 Arquivos e Suas Funções

### 1. `core/services/IWhatsAppService.ts`
**Função**: Interface que define o contrato do serviço WhatsApp seguindo o padrão SOLID (Dependency Inversion Principle).

**Responsabilidades**:
- Define métodos para enviar mensagens
- Define método para verificar webhook
- Define método para processar mensagens recebidas
- Tipos TypeScript para todas as estruturas de dados do WhatsApp

**Tipos Principais**:
- `WhatsAppMessageResponse`: Resposta ao enviar mensagem
- `SendMessageParams`: Parâmetros para envio
- `WhatsAppWebhookEntry`: Estrutura do webhook recebido

---

### 2. `infra/whatsapp/WhatsAppService.ts`
**Função**: Implementação real do serviço WhatsApp usando a Meta Cloud API.

**Responsabilidades**:
- Enviar mensagens via API do WhatsApp
- Verificar token do webhook (requisito da Meta)
- Processar mensagens recebidas e converter para entidades do domínio
- Gerenciar credenciais via variáveis de ambiente

**Métodos Principais**:
- `sendMessage()`: Envia mensagem via HTTP POST para API da Meta
- `verifyWebhook()`: Valida token na verificação inicial do webhook
- `processWebhook()`: Processa entrada do webhook e extrai mensagens

**Variáveis de Ambiente Necessárias**:
- `WHATSAPP_PHONE_NUMBER_ID`: ID do número WhatsApp Business
- `WHATSAPP_ACCESS_TOKEN`: Token de acesso permanente
- `WHATSAPP_API_VERSION`: Versão da API (padrão: v21.0)
- `WHATSAPP_VERIFY_TOKEN`: Token para verificação do webhook

---

### 3. `core/usecases/SendWhatsAppMessageUseCase.ts`
**Função**: Use case que orquestra o envio de mensagens via WhatsApp.

**Responsabilidades**:
- Executar o envio da mensagem via serviço WhatsApp
- Salvar a mensagem enviada no repositório (persistência)
- Retornar a entidade Message criada

**Fluxo**:
1. Recebe parâmetros (to, message, type, etc.)
2. Chama serviço WhatsApp para enviar
3. Cria entidade Message com dados da resposta
4. Salva no repositório via ServiceLocator
5. Retorna a mensagem criada

---

### 4. `core/usecases/HandleIncomingWhatsAppMessageUseCase.ts`
**Função**: Use case que processa mensagens recebidas via webhook.

**Responsabilidades**:
- Processar entrada do webhook do WhatsApp
- Converter mensagens recebidas para entidades do domínio
- Persistir mensagens no repositório
- Preparar estrutura para lógica de fluxos futura

**Fluxo**:
1. Recebe entrada do webhook (WhatsAppWebhookEntry)
2. Processa via serviço WhatsApp (extrai mensagens)
3. Salva cada mensagem no repositório
4. Retorna array de mensagens processadas

**Nota**: A lógica de processamento de fluxos pode ser adicionada aqui no futuro.

---

### 5. `app/api/webhook/whatsapp/route.ts`
**Função**: Endpoint Next.js para receber webhooks do WhatsApp.

**Responsabilidades**:
- **GET**: Verificar webhook (requisito da Meta para configuração inicial)
- **POST**: Receber mensagens e eventos do WhatsApp
- Processar cada entrada recebida
- Retornar 200 para confirmar recebimento (evitar retry)

**GET (Verificação)**:
- Meta envia `hub.mode`, `hub.verify_token`, `hub.challenge`
- Valida token com serviço WhatsApp
- Retorna challenge se válido

**POST (Mensagens)**:
- Recebe JSON com estrutura `{ object: "whatsapp_business_account", entry: [...] }`
- Processa cada entrada via HandleIncomingWhatsAppMessageUseCase
- Sempre retorna 200 (mesmo com erro) para evitar retry desnecessário

---

### 6. `app/api/messages/send/route.ts`
**Função**: API REST para envio manual de mensagens via WhatsApp.

**Responsabilidades**:
- Validar parâmetros de entrada
- Executar SendWhatsAppMessageUseCase
- Retornar resultado ou erro apropriado

**Request Body**:
```json
{
  "to": "5511999999999",
  "message": "Olá! Como posso ajudar?",
  "type": "text" // ou "template"
}
```

**Response**:
```json
{
  "id": "wamid.xxx",
  "from": "...",
  "to": "5511999999999",
  "content": "...",
  "type": "text",
  "timestamp": "2025-01-XX...",
  "direction": "outgoing",
  "status": "sent"
}
```

---

### 7. `infra/adapters/ServiceLocator.ts` (Atualizado)
**Função**: Gerenciador de dependências (Service Locator pattern).

**Alterações**:
- Adicionado `getWhatsAppService()` e `setWhatsAppService()`
- Inicialização automática do WhatsAppService real
- Permite trocar implementação facilmente (mock para testes)

---

## 🔧 Configuração e Setup

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# WhatsApp Business API - Meta Cloud API
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui
WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui
WHATSAPP_API_VERSION=v21.0
WHATSAPP_VERIFY_TOKEN=seu_token_aleatorio_seguro_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Como Obter as Credenciais

#### Passo 1: Criar App no Meta for Developers
1. Acesse: https://developers.facebook.com/
2. Crie uma conta ou faça login
3. Vá em "Meus Apps" > "Criar App"
4. Selecione "Business" como tipo

#### Passo 2: Adicionar Produto WhatsApp
1. No painel do app, adicione o produto "WhatsApp"
2. Siga o wizard de configuração
3. Anote o **Phone Number ID** (número do telefone conectado)

#### Passo 3: Gerar Access Token
1. Vá em "WhatsApp" > "Getting Started"
2. Em "Temporary access token", clique para gerar permanente
3. Ou vá em "System Users" e crie um token permanente
4. Copie o **Access Token**

#### Passo 4: Configurar Webhook
1. Vá em "WhatsApp" > "Configuration"
2. Em "Webhook", clique em "Edit"
3. URL do Callback: `https://seu-dominio.com/api/webhook/whatsapp`
4. Token de Verificação: use o mesmo valor de `WHATSAPP_VERIFY_TOKEN`
5. Campos de Assinatura: selecione `messages` e `message_status`
6. Salve e verifique (Meta fará GET no webhook)

### 3. Deploy e URL Pública

Para desenvolvimento local, use **ngrok** ou similar:

```bash
ngrok http 3000
```

Use a URL do ngrok (ex: `https://xxxx.ngrok.io`) no webhook do Meta.

Para produção, use Vercel/Netlify e configure o webhook com a URL real.

---

## 🚀 Como Usar

### Enviar Mensagem Manualmente

**Via API REST**:
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste."
  }'
```

**Via Código**:
```typescript
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';

const useCase = new SendWhatsAppMessageUseCase();
const message = await useCase.execute({
  to: '5511999999999',
  message: 'Olá! Como posso ajudar?',
});
```

### Receber Mensagens

As mensagens são recebidas automaticamente via webhook quando alguém envia uma mensagem para o número WhatsApp Business configurado. O sistema processa e salva automaticamente.

### Enviar Template (Mensagem Pré-aprovada)

```typescript
const message = await useCase.execute({
  to: '5511999999999',
  message: '',
  type: 'template',
  templateName: 'nome_do_template',
  templateParams: ['parametro1', 'parametro2'],
});
```

**Importante**: Templates precisam ser aprovados pela Meta antes do uso.

---

## 🔍 Fluxo Completo

### Envio de Mensagem
```
Frontend/Dashboard
    ↓
API /api/messages/send
    ↓
SendWhatsAppMessageUseCase
    ↓
WhatsAppService.sendMessage()
    ↓
Meta Cloud API
    ↓
Resposta → Salva no Repository
```

### Recebimento de Mensagem
```
Cliente WhatsApp
    ↓
Meta Cloud API
    ↓
Webhook /api/webhook/whatsapp
    ↓
HandleIncomingWhatsAppMessageUseCase
    ↓
WhatsAppService.processWebhook()
    ↓
Salva no Repository
    ↓
(Próximo: Processar fluxos)
```

---

## 🧪 Testes

### Testar Webhook Localmente

1. Use ngrok para expor localhost:
```bash
ngrok http 3000
```

2. Configure webhook no Meta com URL do ngrok

3. Envie uma mensagem para o número WhatsApp Business

4. Verifique os logs do servidor

### Testar Envio de Mensagem

```bash
# Inicie o servidor
npm run dev

# Em outro terminal, teste envio
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "message": "Teste"}'
```

---

## ⚠️ Considerações Importantes

### Segurança
- **NUNCA** commite o `.env.local` com tokens reais
- Use variáveis de ambiente seguras em produção
- O `WHATSAPP_VERIFY_TOKEN` deve ser aleatório e seguro

### Rate Limits
- A Meta tem limites de taxa para envio de mensagens
- Implemente rate limiting se necessário
- Monitore o uso no painel da Meta

### Custos
- Mensagens para clientes podem ter custos (depends do plano)
- Verifique os custos na documentação da Meta

### Templates
- Mensagens iniciadas por você (outbound) precisam de templates aprovados
- Mensagens de resposta (dentro de 24h) podem ser texto livre

---

## 📚 Próximos Passos

1. **Integrar com Fluxos**: Adicionar lógica no `HandleIncomingWhatsAppMessageUseCase` para processar mensagens baseado em fluxos configurados
2. **Suporte a Mídia**: Implementar upload/download de imagens/áudios/documentos
3. **Status de Entrega**: Atualizar status de mensagens enviadas quando receber webhook de status
4. **Queue System**: Implementar fila para envio em massa
5. **Métricas**: Adicionar tracking de mensagens enviadas/recebidas

---

## 🔗 Referências

- [Documentação Oficial Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Guia de Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Templates de Mensagens](https://developers.facebook.com/docs/whatsapp/message-templates)

---

## 📝 Changelog

### 2025-01-XX - Implementação Inicial
- ✅ Interface IWhatsAppService criada
- ✅ Implementação WhatsAppService com Meta Cloud API
- ✅ Use cases para enviar e receber mensagens
- ✅ API routes para webhook e envio
- ✅ Integração com ServiceLocator
- ✅ Documentação completa





