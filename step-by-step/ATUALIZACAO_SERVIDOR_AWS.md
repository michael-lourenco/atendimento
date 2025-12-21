# 🔄 Atualização do Servidor AWS

## ⚠️ Situação Atual

O servidor na AWS (`http://3.84.228.243:3000`) está rodando uma **versão antiga** do código que **não possui** os endpoints `/api/*` que foram adicionados para integração.

### Endpoints Disponíveis (Versão Antiga)
- ✅ `GET /` - Página HTML com QR Code
- ✅ `GET /qr-data` - QR Code em JSON (formato antigo)
- ✅ `GET /qr.png` - QR Code como imagem PNG
- ✅ `GET /health` - Health check

### Endpoints Não Disponíveis (Precisam de Deploy)
- ❌ `GET /api/qr` - QR Code em JSON (formato novo)
- ❌ `GET /api/status` - Status da conexão
- ❌ `GET /api/messages` - Lista de mensagens
- ❌ `GET /api/messages/:userId` - Mensagens por usuário
- ❌ `POST /api/messages` - Enviar mensagem

## ✅ Solução Temporária Implementada

O código do `chatbot-atimo` foi atualizado para ser **compatível com ambas as versões**:

1. **Tenta primeiro** os endpoints novos (`/api/qr`, `/api/status`)
2. **Se falhar**, usa os endpoints antigos (`/qr-data`, `/health`)
3. **Mensagens**: Retorna lista vazia se o endpoint não existir

Isso permite que o sistema funcione **agora mesmo** enquanto o servidor não é atualizado.

## 🚀 Atualizar Servidor AWS (Recomendado)

Para ter todas as funcionalidades, você precisa fazer um novo deploy do código atualizado:

### Opção 1: Deploy Automatizado (Recomendado)

```bash
cd /home/michael/devTestes/chat-whatsapp

# 1. Verificar se tem arquivo .env configurado
cat .env

# 2. Executar deploy
chmod +x deploy-aws.sh
./deploy-aws.sh
```

O script vai:
- ✅ Fazer build da nova imagem Docker
- ✅ Fazer push para ECR
- ✅ Atualizar o serviço ECS com a nova imagem

### Opção 2: Deploy Manual

```bash
cd /home/michael/devTestes/chat-whatsapp

# 1. Obter credenciais AWS
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=us-east-1  # Ajuste para sua região

# 2. Login no ECR
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# 3. Build da imagem
docker build -t whatsapp-bot .

# 4. Tag da imagem
docker tag whatsapp-bot:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/whatsapp-bot:latest

# 5. Push para ECR
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/whatsapp-bot:latest

# 6. Forçar atualização do serviço ECS
aws ecs update-service \
  --cluster whatsapp-bot-cluster \
  --service whatsapp-bot-service \
  --force-new-deployment \
  --region ${AWS_REGION}
```

## 📋 Verificar Após Deploy

Após o deploy, teste os novos endpoints:

```bash
# Testar endpoint novo de QR Code
curl http://3.84.228.243:3000/api/qr

# Testar endpoint novo de status
curl http://3.84.228.243:3000/api/status

# Testar endpoint de mensagens
curl http://3.84.228.243:3000/api/messages?limit=10
```

## 🔍 Diferenças Entre Versões

### Versão Antiga (Atual na AWS)
```json
// GET /qr-data
{
  "qr": "data:image/png;base64,...",
  "available": true
}

// GET /health
{
  "status": "ok",
  "qrAvailable": true
}
```

### Versão Nova (Após Deploy)
```json
// GET /api/qr
{
  "qr": "data:image/png;base64,...",
  "available": true,
  "connected": false
}

// GET /api/status
{
  "connected": false,
  "qrAvailable": true,
  "info": {
    "wid": null,
    "pushname": null,
    "platform": null
  }
}

// GET /api/messages
{
  "messages": [...],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

## ⏱️ Tempo Estimado

- **Deploy automatizado**: ~10-15 minutos
- **Deploy manual**: ~15-20 minutos
- **Downtime**: Mínimo (ECS faz rolling update)

## ✅ Status Atual

- ✅ Sistema funciona com versão antiga (compatibilidade implementada)
- ⏳ Aguardando deploy para funcionalidades completas
- ✅ QR Code funciona
- ⚠️ Mensagens retornam vazias até deploy

---

**Última atualização**: 2025-01-27
**Status**: Funcional com fallback para versão antiga

