# 02 — Domínio

## Entidades (`core/entities`)

| Entidade | Papel |
|----------|--------|
| `User` / `AuthUser` | Operador do painel (`admin` \| `user`) |
| `Flow` + `FlowStep` | Automação: `message` \| `question` \| `condition` \| `action` |
| `FlowSession` | Passo atual do contato no fluxo |
| `Message` | Mensagem WhatsApp (in/out, tipo, status) |
| `Conversation` | Atendimento com contato, setor, agente, tags, status |
| `Department` | Setor (cor, ativos, contagens) |
| `InternalMessage` | Chat interno / nota / transferência |
| `Chatbot` | Bot cadastrado no painel (pode apontar `flowId`) |
| `Agent` | Atendente (`online` \| `offline`) |
| `Contact` | Contato WhatsApp + etiquetas |
| `WhatsAppNumber` | Número conectado |
| `Tag` | Etiqueta (`color`, `contactsCount`) |
| `ScheduledMessage` | Envio futuro (`pending` \| `sent` \| `failed`) |
| `Report` | Snapshot gerado no painel |
| `DashboardMetrics` | KPIs calculados (não hardcoded) |

Novas entidades exigem interface de repositório em `core/repositories` e mock em `infra/mocks` **antes** da UI.

## Repositórios (portas)

- `IAuthRepository` — login, logout, usuário atual
- `IFlowRepository` — CRUD de fluxos
- `IFlowSessionRepository` — sessão por `contactId` (upsert)
- `IMessageRepository` — histórico por contato
- `IMediaStorage` — cache de áudio/imagem/vídeo/documento (bucket `media`); path `messages/{id}`
- `IConversationRepository`, `IDepartmentRepository`, `IInternalMessageRepository`
- `IChatbotRepository`, `IAgentRepository`, `IContactRepository`, `IWhatsAppNumberRepository`, `ITagRepository`, `IScheduledMessageRepository`, `IReportRepository` — CRUD (`ICrudRepository`)

Catálogos do painel usam `CatalogUseCase` (`list` / `save` / `delete`). Conversas: `GetAllConversationsUseCase`, `TransferConversationUseCase`. Relatórios: `GetDashboardMetricsUseCase`, `ReportCatalogUseCase`, `GenerateReportUseCase`.

## Use cases existentes

Auth: `LoginUseCase`, `LogoutUseCase`, `GetCurrentUserUseCase`  
Fluxos: `GetAllFlowsUseCase`, `GetFlowByIdUseCase`, `SaveFlowUseCase`, `DeleteFlowUseCase`  
Mensagens: `GetAllMessagesUseCase`, `GetMessagesByContactUseCase`  
WhatsApp: `SendWhatsAppMessageUseCase`, `HandleIncomingWhatsAppMessageUseCase`, `UpsertConversationFromMessageUseCase`, `UpsertContactFromIncomingUseCase`  
Motor: `ProcessIncomingFlowUseCase` (incoming texto → respostas do fluxo)

## Invariantes

1. Mensagem incoming/outgoing tem `direction` e `status` válidos.
2. Só fluxo `isActive` entra no motor.
3. Conversa: status `open` \| `closed` \| `waiting` \| `transferred`. Toda `Message` persistida cria/atualiza `Conversation` (`id` = telefone) e `Contact` (`id`/`phone` = telefone, `name` = `pushName` do WhatsApp quando houver). Não sobrescrever nome real por número.
4. Auth **mock (Fases 1–3):** senha irrelevante; `admin@example.com` / `user@example.com`. Auth **Supabase (Fase 4):** senha real; papel em `profiles`; sem usuários de teste na UI — ver `08-supabase.md`.
5. Use case não chama Axios/Meta/Twilio direto — só `IWhatsAppService`.
6. Uma sessão por `contactId`. Sem fluxo ativo: incoming é persistida e **nenhuma** resposta automática é enviada.
7. No máximo 20 passos por turno (ciclo).

## FlowSession

```ts
{
  contactId: string;
  flowId: string;
  currentStepId: string | null; // passo aguardando resposta; null = fluxo encerrado / próxima msg recomeça
  updatedAt: Date;
}
```

## Motor de fluxos (Fase 2)

Planejamento puro em `core/engine` (`planFlowTurn`, `evaluateCondition`, `resolveActiveFlow`). I/O no use case: persistir sessão e enviar via `SendWhatsAppMessageUseCase`.

### Resolver fluxo

1. Se há sessão e o `flowId` ainda existe e está ativo → esse fluxo.
2. Senão, entre os ativos: `id === "inicio"`, senão nome `"Atendimento Inicial"`, senão o primeiro ativo.
3. Senão → log, sem resposta.

### Turno (`planFlowTurn`)

- **Sem sessão ou `currentStepId` null:** começa no primeiro passo do fluxo. A mensagem do usuário só dispara o fluxo; o texto alimenta `condition` encontradas **antes** de uma `question` no mesmo turno.
- **`currentStepId` em `question`:** o texto é a resposta; o motor segue `nextStepId` (não reenvia a pergunta).
- **`message` / `action`:** envia `content` se não vazio; segue `nextStepId`. `action` na Fase 2 não dispara efeito externo.
- **`question`:** envia `content`; se houver `options`, concatena uma linha `- opção` por item; grava `currentStepId` nessa pergunta e **para**.
- **`condition`:** `field` suportado: `content` (texto incoming do turno). Outro `field` → ramo `false`. Operadores: `equals` e `contains` (trim, case-insensitive); `greaterThan` / `lessThan` numéricos (`Number`); `NaN` → `false`. Segue `trueStepId` ou `falseStepId`.
- Passo ou `nextStepId` inexistente → encerra (`currentStepId` null). Próxima mensagem recomeça o fluxo resolvido.
- `question` não valida se a resposta está em `options`.

Entrada do motor: só incoming `type === "text"` com conteúdo não vazio. Mídia: persiste, não avança fluxo. Áudio/imagem/vídeo/documento são reproduzíveis no painel via `GET /api/messages/{id}/media` (cache no Storage; se faltar, a Evolution entrega o base64 pelo `id` da mensagem).

## Testes obrigatórios (escrever; usuário executa)

- Primeira mensagem cria sessão e envia passos até a primeira `question`.
- Resposta avança `nextStepId`.
- `condition` ramos true e false.
