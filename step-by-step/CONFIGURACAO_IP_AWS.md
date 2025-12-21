# 🌐 Configuração do IP Público AWS

## 📋 Informação Atual

O IP público atual do `chat-whatsapp` na AWS é:
```
http://3.84.228.243:3000
```

## ⚙️ Configuração no chatbot-atimo

Para que o `chatbot-atimo` acesse o `chat-whatsapp` na AWS, configure a variável de ambiente:

### Arquivo `.env.local` (Desenvolvimento Local)

```env
# URL do chat-whatsapp na AWS
CHAT_WHATSAPP_API_URL=http://3.84.228.243:3000
```

### Arquivo `.env.production` (Produção)

```env
# URL do chat-whatsapp na AWS
CHAT_WHATSAPP_API_URL=http://3.84.228.243:3000
```

## 🔍 Verificação

### 1. Testar se o servidor está acessível:

```bash
curl http://3.84.228.243:3000/health
```

Deve retornar:
```json
{
  "status": "ok",
  "qrAvailable": true,
  "connected": false
}
```

### 2. Testar API do QR Code:

```bash
curl http://3.84.228.243:3000/api/qr
```

### 3. Testar API de Status:

```bash
curl http://3.84.228.243:3000/api/status
```

### 4. Testar API de Mensagens:

```bash
curl http://3.84.228.243:3000/api/messages?limit=10
```

## ⚠️ Importante

### Sobre o QR Code do WhatsApp

O QR Code gerado pelo `whatsapp-web.js` **NÃO contém o IP do servidor**. Ele contém:
- Informações de autenticação do WhatsApp Web
- Token de sessão temporário
- Dados criptografados para conexão

O QR Code é gerado pelos servidores do WhatsApp e o `whatsapp-web.js` apenas recebe e exibe esse código. O servidor precisa estar:
- ✅ Acessível para receber mensagens
- ✅ Com conexão à internet
- ✅ Rodando na porta correta (3000)

### IP Público vs IP Privado

Na AWS:
- **IP Público** (`3.84.228.243`): Usado para acessar o servidor de fora da AWS
- **IP Privado**: Usado internamente na VPC

O servidor está configurado para escutar em `0.0.0.0`, o que significa que aceita conexões de qualquer IP, tanto público quanto privado.

## 🔄 Se o IP Mudar

Se o IP público da AWS mudar (por exemplo, ao reiniciar a instância sem Elastic IP):

1. **Obter novo IP público:**
   ```bash
   # Via AWS CLI
   aws ec2 describe-instances \
     --filters "Name=tag:Name,Values=whatsapp-bot" \
     --query 'Reservations[*].Instances[*].PublicIpAddress' \
     --output text
   ```

2. **Atualizar variável de ambiente:**
   - Atualizar `CHAT_WHATSAPP_API_URL` no `.env.local` ou `.env.production`
   - Reiniciar o `chatbot-atimo`

3. **Ou usar Elastic IP (Recomendado):**
   - Criar um Elastic IP na AWS
   - Associar à instância
   - O IP não mudará mais

## 📝 URLs Completas

Com o IP atual, as URLs são:

- **Interface Web**: http://3.84.228.243:3000/
- **QR Code API**: http://3.84.228.243:3000/api/qr
- **Status API**: http://3.84.228.243:3000/api/status
- **Mensagens API**: http://3.84.228.243:3000/api/messages
- **Health Check**: http://3.84.228.243:3000/health

## 🔒 Segurança

⚠️ **Atenção**: O servidor está exposto publicamente na porta 3000. Para produção, considere:

1. **Usar HTTPS** (via Load Balancer ou CloudFront)
2. **Autenticação** na API (API Key ou JWT)
3. **Firewall** (Security Group) para limitar acesso
4. **Rate Limiting** para prevenir abuso

---

**Última atualização**: 2025-01-27
**IP Atual**: 3.84.228.243:3000

