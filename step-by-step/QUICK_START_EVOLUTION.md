# 🚀 Quick Start - Evolution API

## ⚡ Início Rápido (5 minutos)

### 1. Instalar Evolution API via Docker

```bash
# Criar arquivo docker-compose.yml
cat > docker-compose.yml << 'EOF'
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
      - AUTHENTICATION_API_KEY=minha_chave_secreta_123
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=http://localhost:3000/api/webhook/evolution
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
volumes:
  evolution_instances:
  evolution_store:
EOF

# Iniciar
docker-compose up -d
```

### 2. Criar Instância e Escanear QR Code

```bash
# Criar instância
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: minha_chave_secreta_123" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "default", "qrcode": true}'

# Obter QR Code
curl -X GET http://localhost:8080/instance/connect/default \
  -H "apikey: minha_chave_secreta_123"
```

Escaneie o QR Code com seu WhatsApp.

### 3. Configurar `.env.local`

```env
WHATSAPP_PROVIDER=evolution
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=minha_chave_secreta_123
EVOLUTION_INSTANCE_NAME=default
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Testar Envio

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Teste Evolution API"
  }'
```

## ✅ Pronto!

Agora você está usando Evolution API como serviço intermediário.

Para mais detalhes, consulte: `step-by-step/IMPLEMENTACAO_EVOLUTION.md`

