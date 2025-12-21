# 🔗 Integração chat-whatsapp com chatbot-atimo

## 📋 Visão Geral

Este documento detalha a integração entre o `chat-whatsapp` (backend na AWS) e o `chatbot-atimo` (frontend/API Next.js). O objetivo é fazer o `chatbot-atimo` funcionar como frontend, exibindo o QR Code e as mensagens do WhatsApp em tempo real.

## 🏗️ Arquitetura da Integração

```
┌─────────────────────┐         ┌──────────────────────┐
│  chatbot-atimo      │         │   chat-whatsapp      │
│  (Frontend/API)     │◄────────┤   (Backend AWS)      │
│                     │  HTTP   │                      │
│  - Next.js         │         │  - Node.js/Express   │
│  - React            │         │  - whatsapp-web.js   │
│  - Dashboard        │         │  - API REST          │
└─────────────────────┘         └──────────────────────┘
```

## 📁 Arquivos Criados/Modificados

### Backend (chat-whatsapp)

#### `server.js` (modificado)
**Mudanças**:
- Adicionado middleware `express.json()` para parse de JSON
- Criado armazenamento de mensagens em memória (`mensagensArmazenadas`)
- Adicionados endpoints REST:
  - `GET /api/qr` - Retorna QR Code atual
  - `GET /api/status` - Status da conexão WhatsApp
  - `GET /api/messages` - Lista mensagens recentes
  - `GET /api/messages/:userId` - Mensagens de um usuário específico
  - `POST /api/messages` - Enviar mensagem (opcional)
- Armazenamento automático de todas as mensagens (recebidas e enviadas)
- Limite de 1000 mensagens em memória

**Função**: Expõe API REST para o frontend consumir dados do WhatsApp.

### Frontend (chatbot-atimo)

#### `infra/whatsapp/ChatWhatsAppService.ts` (novo)
**Função**: Serviço para consumir a API do chat-whatsapp.

**Métodos**:
- `getQRCode()` - Obtém QR Code atual
- `getStatus()` - Obtém status da conexão
- `getMessages()` - Lista mensagens recentes
- `getMessagesByUser()` - Mensagens de um usuário
- `sendMessage()` - Envia mensagem

#### `app/api/chat-whatsapp/qr/route.ts` (novo)
**Função**: Endpoint Next.js para obter QR Code.

**Rota**: `GET /api/chat-whatsapp/qr`

#### `app/api/chat-whatsapp/status/route.ts` (novo)
**Função**: Endpoint Next.js para obter status da conexão.

**Rota**: `GET /api/chat-whatsapp/status`

#### `app/api/chat-whatsapp/messages/route.ts` (novo)
**Função**: Endpoint Next.js para listar/enviar mensagens.

**Rotas**:
- `GET /api/chat-whatsapp/messages?limit=50&offset=0`
- `POST /api/chat-whatsapp/messages` (Body: `{ to, message }`)

#### `app/api/chat-whatsapp/messages/[userId]/route.ts` (novo)
**Função**: Endpoint Next.js para mensagens de um usuário específico.

**Rota**: `GET /api/chat-whatsapp/messages/[userId]`

#### `app/dashboard/whatsapp/page.tsx` (novo)
**Função**: Página do dashboard para gerenciar WhatsApp.

**Funcionalidades**:
- Exibe QR Code para conexão
- Mostra status da conexão (conectado/desconectado)
- Lista mensagens em tempo real
- Auto-refresh automático:
  - QR Code: a cada 5 segundos (se desconectado)
  - Mensagens: a cada 3 segundos (se conectado)
- Interface com abas (Conexão / Mensagens)

#### `ui/components/sidebar.tsx` (modificado)
**Mudança**: Adicionado item "WhatsApp" no menu lateral.

## ⚙️ Configuração

### Variáveis de Ambiente

#### chat-whatsapp
Nenhuma variável adicional necessária. O servidor já está configurado.

#### chatbot-atimo
Adicione no `.env.local`:

```env
# URL do chat-whatsapp (backend)
# Para desenvolvimento local:
# CHAT_WHATSAPP_API_URL=http://localhost:3000

# Para produção (AWS) - IP atual:
CHAT_WHATSAPP_API_URL=http://3.84.228.243:3000
```

**Nota**: O IP público atual da AWS é `3.84.228.243:3000`. Se o IP mudar, atualize esta variável.
Veja `step-by-step/CONFIGURACAO_IP_AWS.md` para mais detalhes.

## 🚀 Como Usar

### 1. Iniciar chat-whatsapp (Backend)

```bash
cd chat-whatsapp
npm install
npm start
```

O servidor iniciará na porta 3000 (ou a porta definida em `PORT`).

### 2. Iniciar chatbot-atimo (Frontend)

```bash
cd chatbot-atimo
npm install
npm run dev
```

O frontend iniciará na porta 3001 (ou próxima disponível).

### 3. Acessar Dashboard

1. Acesse: `http://localhost:3001/login`
2. Faça login (use credenciais de teste)
3. No menu lateral, clique em "WhatsApp"
4. Você verá:
   - **Aba Conexão**: QR Code e status
   - **Aba Mensagens**: Lista de mensagens em tempo real

### 4. Conectar WhatsApp

1. Na aba "Conexão", aguarde o QR Code aparecer
2. Abra o WhatsApp no celular
3. Vá em: Menu → Aparelhos conectados → Conectar um aparelho
4. Escaneie o QR Code
5. Aguarde a confirmação (status mudará para "Conectado")

### 5. Visualizar Mensagens

1. Após conectar, vá para a aba "Mensagens"
2. As mensagens serão atualizadas automaticamente a cada 3 segundos
3. Mensagens recebidas aparecem à esquerda (cinza)
4. Mensagens enviadas aparecem à direita (azul)

## 📊 Estrutura de Dados

### QRCodeResponse
```typescript
{
  qr: string | null;        // Base64 da imagem do QR Code
  available: boolean;        // Se o QR Code está disponível
  connected: boolean;        // Se está conectado
}
```

### StatusResponse
```typescript
{
  connected: boolean;
  qrAvailable: boolean;
  info: {
    wid: string | null;     // ID do WhatsApp
    pushname: string | null; // Nome do perfil
    platform: string | null; // Plataforma
  } | null;
}
```

### WhatsAppMessage
```typescript
{
  id: string;               // ID único da mensagem
  from: string;             // Remetente (formato: 5511999999999@c.us)
  to: string;               // Destinatário
  content: string;          // Conteúdo da mensagem
  type: string;             // Tipo (text, image, etc)
  direction: 'incoming' | 'outgoing';
  timestamp: string;        // ISO 8601
  status: string;          // Status (sent, received, etc)
}
```

## 🔄 Fluxo de Dados

### 1. Obter QR Code
```
Frontend → GET /api/chat-whatsapp/qr
         → ChatWhatsAppService.getQRCode()
         → GET http://chat-whatsapp:3000/api/qr
         → Retorna QR Code
```

### 2. Verificar Status
```
Frontend → GET /api/chat-whatsapp/status
         → ChatWhatsAppService.getStatus()
         → GET http://chat-whatsapp:3000/api/status
         → Retorna status da conexão
```

### 3. Listar Mensagens
```
Frontend → GET /api/chat-whatsapp/messages
         → ChatWhatsAppService.getMessages()
         → GET http://chat-whatsapp:3000/api/messages
         → Retorna lista de mensagens
```

### 4. Receber Mensagem (Automático)
```
WhatsApp → chat-whatsapp (whatsapp-web.js)
         → Armazena em mensagensArmazenadas
         → Frontend busca via polling (3s)
         → Exibe na interface
```

## 🎯 Funcionalidades Implementadas

✅ **Exibição de QR Code**
- QR Code exibido automaticamente quando disponível
- Auto-refresh a cada 5 segundos se desconectado
- Instruções de conexão exibidas

✅ **Status da Conexão**
- Indicador visual (verde = conectado, vermelho = desconectado)
- Informações do perfil conectado
- Atualização automática

✅ **Visualização de Mensagens**
- Lista todas as mensagens (recebidas e enviadas)
- Diferenciação visual (recebidas à esquerda, enviadas à direita)
- Timestamp formatado
- Auto-refresh a cada 3 segundos
- Scroll automático para novas mensagens

✅ **Interface Responsiva**
- Abas para organizar conteúdo
- Design consistente com o resto do dashboard
- Loading states
- Tratamento de erros

## 🔮 Próximos Passos

### Melhorias Futuras

1. **WebSocket em vez de Polling**
   - Implementar WebSocket no chat-whatsapp
   - Atualização em tempo real sem polling
   - Reduzir carga no servidor

2. **Filtros e Busca**
   - Filtrar mensagens por usuário
   - Buscar mensagens por conteúdo
   - Ordenação por data/usuário

3. **Envio de Mensagens**
   - Interface para enviar mensagens manualmente
   - Seleção de destinatário
   - Histórico de conversas por usuário

4. **Persistência**
   - Migrar armazenamento de memória para banco de dados
   - Histórico completo de mensagens
   - Backup automático

5. **Notificações**
   - Notificações em tempo real de novas mensagens
   - Badge com contador de não lidas
   - Som de notificação (opcional)

6. **Estatísticas**
   - Dashboard com métricas
   - Gráficos de mensagens por período
   - Análise de conversas

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se o chat-whatsapp está rodando
- Verifique a URL em `CHAT_WHATSAPP_API_URL`
- Verifique os logs do chat-whatsapp

### Mensagens não aparecem
- Verifique se o WhatsApp está conectado
- Verifique se o polling está funcionando (console do navegador)
- Verifique os logs do chat-whatsapp

### Erro de CORS
- Se estiver em domínios diferentes, configure CORS no chat-whatsapp:
```javascript
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
```

### Erro de conexão
- Verifique se a URL do chat-whatsapp está correta
- Verifique se o servidor está acessível
- Verifique firewall/proxy

## 📚 Referências

- [whatsapp-web.js Documentation](https://wwebjs.dev/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Express.js](https://expressjs.com/)

---

**Data da implementação**: 2025-01-27
**Status**: ✅ Funcional

