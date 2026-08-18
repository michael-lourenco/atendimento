# 💡 Exemplos de Uso - Integração WhatsApp

## Exemplo 1: Enviar Mensagem Simples

```typescript
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';

const useCase = new SendWhatsAppMessageUseCase();

try {
  const message = await useCase.execute({
    to: '5511999999999', // Número com código do país (Brasil: 55)
    message: 'Olá! Esta é uma mensagem de teste.',
    type: 'text',
  });
  
  console.log('Mensagem enviada:', message.id);
} catch (error) {
  console.error('Erro ao enviar:', error);
}
```

## Exemplo 2: Enviar Mensagem via API REST

```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá! Como posso ajudar?"
  }'
```

## Exemplo 3: Enviar Template Aprovado

```typescript
const message = await useCase.execute({
  to: '5511999999999',
  message: '', // Vazio para templates
  type: 'template',
  templateName: 'hello_world', // Nome do template aprovado
  templateParams: ['João'], // Parâmetros do template
});
```

## Exemplo 4: Processar Mensagem Recebida (Webhook)

As mensagens são processadas automaticamente, mas você pode adicionar lógica customizada:

```typescript
import { HandleIncomingWhatsAppMessageUseCase } from '@/core/usecases/HandleIncomingWhatsAppMessageUseCase';

const useCase = new HandleIncomingWhatsAppMessageUseCase();

// Isso é chamado automaticamente pelo webhook
const messages = await useCase.execute(webhookEntry);

// Você pode adicionar lógica aqui, por exemplo:
for (const message of messages) {
  if (message.content.toLowerCase().includes('oi')) {
    // Responder automaticamente
    const sendUseCase = new SendWhatsAppMessageUseCase();
    await sendUseCase.execute({
      to: message.from,
      message: 'Olá! Como posso ajudar?',
    });
  }
}
```

## Exemplo 5: Integração com Fluxos

```typescript
// No HandleIncomingWhatsAppMessageUseCase ou em um novo use case
import { GetFlowByIdUseCase } from '@/core/usecases/GetFlowByIdUseCase';
import { SendWhatsAppMessageUseCase } from '@/core/usecases/SendWhatsAppMessageUseCase';

async function processMessageWithFlow(message: Message) {
  // Buscar fluxo ativo para o contato
  const flowUseCase = new GetFlowByIdUseCase();
  const flow = await flowUseCase.execute('flow_inicial');
  
  if (flow) {
    // Processar resposta baseada no fluxo
    const response = determineResponse(flow, message);
    
    const sendUseCase = new SendWhatsAppMessageUseCase();
    await sendUseCase.execute({
      to: message.from,
      message: response,
    });
  }
}
```

## Exemplo 6: Webhook Handler Completo (Customizado)

```typescript
// app/api/webhook/whatsapp/route.ts (extensão do existente)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Objeto inválido' }, { status: 400 });
    }

    for (const entry of body.entry) {
      const useCase = new HandleIncomingWhatsAppMessageUseCase();
      const messages = await useCase.execute(entry);
      
      // Processar cada mensagem recebida
      for (const message of messages) {
        // Sua lógica customizada aqui
        console.log(`Mensagem recebida de ${message.from}: ${message.content}`);
        
        // Exemplo: resposta automática
        if (message.type === 'text' && message.content) {
          const sendUseCase = new SendWhatsAppMessageUseCase();
          await sendUseCase.execute({
            to: message.from,
            message: `Você disse: ${message.content}. Como posso ajudar?`,
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}
```

## Exemplo 7: Testar Webhook Localmente com ngrok

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Expor via ngrok
ngrok http 3000

# Copiar URL do ngrok (ex: https://abc123.ngrok.io)
# Configurar no Meta: https://abc123.ngrok.io/api/webhook/whatsapp
```

## Exemplo 8: Validar Configuração

```typescript
// Script de teste simples
import { serviceLocator } from '@/infra/adapters/ServiceLocator';

const whatsAppService = serviceLocator.getWhatsAppService();

try {
  await whatsAppService.sendMessage({
    to: '5511999999999',
    message: 'Teste de configuração',
  });
  console.log('✅ WhatsApp configurado corretamente!');
} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
  console.log('Verifique as variáveis de ambiente no .env.local');
}
```

---

## 🔍 Troubleshooting

### Erro: "WhatsApp credentials não configuradas"
- Verifique se o arquivo `.env.local` existe
- Verifique se as variáveis estão com os nomes corretos
- Reinicie o servidor após alterar `.env.local`

### Erro: "Token de verificação inválido" no webhook
- Certifique-se de que `WHATSAPP_VERIFY_TOKEN` no `.env.local` é igual ao configurado no Meta

### Mensagens não estão sendo recebidas
- Verifique se o webhook está configurado corretamente no Meta
- Verifique se a URL do webhook está acessível publicamente
- Verifique os logs do servidor para erros

### Mensagens não estão sendo enviadas
- Verifique se o `WHATSAPP_ACCESS_TOKEN` está válido
- Verifique se o `WHATSAPP_PHONE_NUMBER_ID` está correto
- Verifique se o número está conectado e ativo no Meta





