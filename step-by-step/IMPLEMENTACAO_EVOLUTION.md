# 📱 Implementação com Evolution API - Guia Passo a Passo

## 📋 Visão Geral

Este documento detalha como configurar e usar o Evolution API como serviço intermediário para WhatsApp. Evolution API é uma solução open-source muito popular no Brasil que usa WhatsApp Web para enviar e receber mensagens.

## 🎯 Por que Evolution API?

- ✅ **Gratuito** (se self-hosted)
- ✅ **Open Source** - Código aberto e customizável
- ✅ **API REST Simples** - Fácil de integrar
- ✅ **Suporte Completo** - Mídia, grupos, status, etc.
- ✅ **Muito Popular no Brasil** - Grande comunidade
- ✅ **Self-Hosted ou Hospedado** - Escolha a opção que preferir

## 🏗️ Opções de Instalação

### Opção 1: Docker (Recomendado - Mais Fácil)

### Opção 2: Serviço Hospedado (Pago)

### Opção 3: Instalação Manual

Vamos focar na **Opção 1 (Docker)** por ser a mais simples.

## 📦 Passo 1: Instalar Evolution API via Docker

### Pré-requisitos:
- Docker e Docker Compose instalados
- Porta 8080 disponível (ou outra de sua escolha)

### 1.1 Criar arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_API_KEY=sua_chave_secreta_aqui
      - CONFIG_SESSION_PHONE_CLIENT=Chrome
      - CONFIG_SESSION_PHONE_NAME=Chrome
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=http://seu-servidor.com/api/webhook/evolution
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      - WEBHOOK_GLOBAL_WEBHOOK_BASE64=false
      - QRCODE=true
      - QRCODE_LIMIT=30
      - QRCODE_COLOR=#198754
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store

volumes:
  evolution_instances:
  evolution_store:
```

### 1.2 Iniciar o Evolution API:

```bash
docker-compose up -d
```

### 1.3 Verificar se está rodando:

```bash
docker ps
# Deve mostrar o container evolution-api rodando
```

Acesse: `http://localhost:8080` - Você verá a interface do Evolution API.

## 🔑 Passo 2: Criar Instância no Evolution API

### 2.1 Via Interface Web:

1. Acesse: `http://localhost:8080`
2. Clique em **"Criar Instância"** ou **"Create Instance"**
3. Preencha:
   - **Nome da Instância**: `default` (ou outro nome de sua escolha)
   - **QR Code**: Será gerado automaticamente
4. Escaneie o QR Code com seu WhatsApp
5. Aguarde a conexão ser estabelecida

### 2.2 Via API REST:

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "default",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Isso retornará um QR Code. Escaneie com seu WhatsApp.

### 2.3 Obter QR Code:

```bash
curl -X GET http://localhost:8080/instance/connect/default \
  -H "apikey: sua_chave_secreta_aqui"
```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

Atualize seu arquivo `.env.local`:

```env
# Escolher Evolution como provedor
WHATSAPP_PROVIDER=evolution

# Configurações Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_chave_secreta_aqui
EVOLUTION_INSTANCE_NAME=default

# Token para verificação do webhook (opcional)
EVOLUTION_VERIFY_TOKEN=seu_token_aleatorio_seguro_aqui

# URL base do seu servidor
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante**: 
- `EVOLUTION_API_KEY` deve ser a mesma chave configurada no Docker (`AUTHENTICATION_API_KEY`)
- `EVOLUTION_INSTANCE_NAME` deve ser o nome da instância criada
- Para produção, use a URL do seu servidor Evolution API

## 🔗 Passo 4: Configurar Webhook no Evolution API

### 4.1 Via Interface Web:

1. Acesse a instância criada
2. Vá em **"Webhooks"** ou **"Configurações"**
3. Configure:
   - **Webhook URL**: `https://seu-dominio.com/api/webhook/evolution`
   - **Eventos**: Selecione os eventos que deseja receber (messages.upsert, etc.)

### 4.2 Via API REST:

```bash
curl -X POST http://localhost:8080/webhook/set/default \
  -H "apikey: sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-dominio.com/api/webhook/evolution",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED"
    ]
  }'
```

**Para desenvolvimento local:**
- Use ngrok: `ngrok http 3000`
- Configure o webhook com a URL do ngrok: `https://xxxx.ngrok.io/api/webhook/evolution`

## 🧪 Passo 5: Testar Envio de Mensagem

### Via API REST:

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Esta é uma mensagem de teste via Evolution API"
  }'
```

### Via Código:

```typescript
import { serviceLocator } from '@/infra/adapters/ServiceLocator';

const whatsAppService = serviceLocator.getWhatsAppService();

await whatsAppService.sendMessage({
  to: '5511999999999',
  message: 'Olá! Mensagem via Evolution API',
});
```

## 📥 Passo 6: Configurar Webhook para Receber Mensagens

O Evolution API envia webhooks em formato diferente da Meta. Precisamos criar um endpoint específico ou adaptar o existente.

### 6.1 Criar endpoint específico para Evolution:

Crie o arquivo `app/api/webhook/evolution/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { serviceLocator } from '@/infra/adapters/ServiceLocator';
import { EvolutionWhatsAppService } from '@/infra/whatsapp/EvolutionWhatsAppService';
import { HandleIncomingWhatsAppMessageUseCase } from '@/core/usecases/HandleIncomingWhatsAppMessageUseCase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Evolution API envia webhooks com estrutura diferente
    const whatsAppService = serviceLocator.getWhatsAppService();
    
    // Se for Evolution API, processar formato específico
    if (whatsAppService instanceof EvolutionWhatsAppService) {
      const messages = await whatsAppService.processEvolutionWebhook(body);
      
      // Salvar mensagens
      const messageRepository = serviceLocator.getMessageRepository();
      for (const message of messages) {
        await messageRepository.save(message);
      }
      
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar webhook do Evolution:', error);
    return NextResponse.json(
      { error: 'Erro interno', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    );
  }
}
```

### 6.2 Formato do Webhook Evolution:

```json
{
  "event": "messages.upsert",
  "instance": "default",
  "data": {
    "key": {
      "id": "3EB0...",
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Mensagem recebida",
      "messageTimestamp": 1234567890
    },
    "messageTimestamp": 1234567890
  }
}
```

## 🔄 Passo 7: Alternar entre Provedores

Para voltar a usar a API da Meta:

```env
WHATSAPP_PROVIDER=meta
```

Para usar Evolution:

```env
WHATSAPP_PROVIDER=evolution
```

Para usar Twilio:

```env
WHATSAPP_PROVIDER=twilio
```

O `ServiceLocator` automaticamente carrega o serviço correto baseado nessa variável.

## ⚠️ Diferenças entre Meta e Evolution

| Recurso | Meta Cloud API | Evolution API |
|---------|----------------|---------------|
| Templates | Suportado | Não suportado diretamente |
| Mídia | Suportado | Suportado |
| Webhooks | Formato específico | Formato diferente |
| Setup | Requer aprovação | Mais simples |
| Custo | Variável | Gratuito (self-host) |
| Conformidade | Oficial | Não oficial (WhatsApp Web) |

## 🐛 Troubleshooting

### Erro: "Credenciais Evolution API não configuradas"
Verifique se todas as variáveis de ambiente estão configuradas no `.env.local`.

### Erro: "Connection refused" ou "ECONNREFUSED"
- Verifique se o Evolution API está rodando: `docker ps`
- Verifique se a URL está correta: `EVOLUTION_API_URL`
- Verifique se a porta está acessível

### QR Code não aparece
- Verifique os logs do container: `docker logs evolution-api`
- Verifique se a instância foi criada corretamente
- Tente recriar a instância

### Mensagens não chegam
1. Verifique se o webhook está configurado corretamente no Evolution API
2. Verifique se a URL do webhook está acessível (use ngrok para desenvolvimento)
3. Verifique os logs do servidor para erros
4. Verifique se o endpoint `/api/webhook/evolution` está criado

### Instância desconectada
- Evolution API pode desconectar se o WhatsApp Web for desconectado
- Reescaneie o QR Code se necessário
- Verifique os logs: `docker logs evolution-api`

## 📚 Recursos Adicionais

- **Documentação Evolution API**: https://doc.evolution-api.com/
- **GitHub Evolution API**: https://github.com/EvolutionAPI/evolution-api
- **Docker Hub**: https://hub.docker.com/r/atendai/evolution-api
- **Comunidade**: Discord do Evolution API

## 🎯 Próximos Passos

1. ✅ Instalar Evolution API (Docker)
2. ✅ Criar instância e escanear QR Code
3. ✅ Configurar variáveis de ambiente
4. ✅ Testar envio de mensagens
5. ⏳ Configurar webhook para receber mensagens
6. ⏳ Adaptar processamento de webhooks (formato Evolution)
7. ⏳ Implementar suporte a mídia
8. ⏳ Configurar para produção

## 🚀 Deploy em Produção

### Opções:

1. **Self-Hosted**: Use Docker em seu próprio servidor
2. **Serviço Hospedado**: Contrate um serviço que oferece Evolution API hospedado
3. **VPS**: Configure em um VPS com Docker

### Recomendações:

- Use HTTPS para webhooks
- Configure firewall adequadamente
- Use variáveis de ambiente seguras
- Configure backup das instâncias
- Monitore os logs regularmente

---

**Arquivo criado em**: `infra/whatsapp/EvolutionWhatsAppService.ts`
**ServiceLocator atualizado**: `infra/adapters/ServiceLocator.ts`
**Webhook Evolution**: `app/api/webhook/evolution/route.ts` (criar se necessário)





