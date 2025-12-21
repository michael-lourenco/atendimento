# ⚙️ Configuração do WhatsApp

## Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# WhatsApp Business API - Meta Cloud API
# Obtenha essas credenciais em: https://developers.facebook.com/apps

# ID do número de telefone WhatsApp (Phone Number ID)
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id_aqui

# Token de acesso permanente (Permanent Access Token)
# IMPORTANTE: Nunca commite esse token. Use variáveis de ambiente seguras.
WHATSAPP_ACCESS_TOKEN=seu_access_token_aqui

# Versão da API (padrão: v21.0)
WHATSAPP_API_VERSION=v21.0

# Token para verificação do webhook (você escolhe esse valor)
# Use um valor aleatório e seguro (ex: gera com: openssl rand -hex 32)
WHATSAPP_VERIFY_TOKEN=seu_token_aleatorio_seguro_aqui

# URL base do seu servidor (usado para configurar o webhook)
# Exemplo para produção: https://seu-dominio.com
# Exemplo para desenvolvimento com ngrok: https://xxxx.ngrok.io
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Como Obter as Credenciais

1. Acesse: https://developers.facebook.com/
2. Crie um App do tipo "Business"
3. Adicione o produto "WhatsApp"
4. Siga o wizard e anote o **Phone Number ID**
5. Gere um **Access Token** permanente
6. Configure o webhook com a URL: `{NEXT_PUBLIC_APP_URL}/api/webhook/whatsapp`
7. Use o mesmo valor de `WHATSAPP_VERIFY_TOKEN` na configuração do webhook

Para mais detalhes, consulte: `/step-by-step/WHATSAPP_INTEGRACAO.md`




